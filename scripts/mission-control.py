#!/usr/bin/env python3
"""Mission Control newsletter helper, driven by the /mission-control command.

  gather            print JSON: next issue number, cursor, posts since the last Mission Control send
  render FILE.json  write <issue dir>/body.html (Listmonk body) + preview.html (full email for review)
  push FILE.json    create the Listmonk DRAFT campaign (never sends)
  test FILE.json    send a test of the draft to Jordan's address only

FILE.json shape:
  {"number": 2, "subject": "...", "intro": "...",
   "posts": [{"title","link","description","coverImage"}],
   "working_on": [{"title": "...", "blurb": "...", "link": "optional"}]}

Needs LISTMONK_API_PASSWORD (api-automation user) in the environment.
"""
import base64, html, json, os, re, sys, urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path

# Cloudflare 403s Python's default user agent; set ours on every request.
_opener = urllib.request.build_opener()
_opener.addheaders = [("User-Agent", "mission-control/1")]
urllib.request.install_opener(_opener)

LISTMONK = "https://newsletter.campaign.help"
LIST_ID, TEMPLATE_ID = 4, 6
FROM = "Jordan Krueger <jordan@jordankrueger.com>"
TEST_TO = "jordan@campaign.help"  # per this repo's CLAUDE.md sending gate
RSS = "https://jordankrueger.com/rss.xml"
OUT = Path.home() / "ClaudeCode/personal/jordankrueger-site/email-templates"
TEMPLATE = OUT / "mission-control-template.html"


def api(path, data=None, method=None):
    auth = base64.b64encode(f"api-automation:{os.environ['LISTMONK_API_PASSWORD']}".encode()).decode()
    req = urllib.request.Request(
        LISTMONK + path,
        data=json.dumps(data).encode() if data is not None else None,
        method=method or ("POST" if data is not None else "GET"),
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def mc_campaigns():
    """Every Mission Control campaign, any status, in one call.
    Listmonk ignores ?list_id= on this endpoint, so filter to the list here."""
    res = api("/api/campaigns?per_page=all")["data"]["results"]
    return [c for c in res if any(l["id"] == LIST_ID for l in c["lists"])]


def unsent(camps):
    return [c for c in camps if c["status"] in ("draft", "scheduled")]


def gather():
    camps = mc_campaigns()
    sent = [c for c in camps if c["status"] == "finished"]
    cursor = max((c["started_at"] or c["created_at"] for c in sent), default="1970-01-01T00:00:00Z")
    with urllib.request.urlopen(RSS, timeout=30) as r:
        root = ET.fromstring(r.read())
    cut = datetime.fromisoformat(cursor.replace("Z", "+00:00"))
    posts = []
    for it in root.iter("item"):
        when = parsedate_to_datetime(it.findtext("pubDate"))
        if when > cut:
            posts.append({
                "title": it.findtext("title"), "link": it.findtext("link"),
                "description": it.findtext("description"), "coverImage": it.findtext("coverImage"),
                "pubDate": when.date().isoformat(),
            })
    # Highest "Mission Control NNN" ever used (any status) + 1, so a deleted campaign never frees its number.
    used = [int(m.group(1)) for c in camps if (m := re.match(r"Mission Control (\d+)", c["name"]))]
    print(json.dumps({
        "number": max(used, default=0) + 1, "cursor": cursor, "posts": posts,
        "pending_drafts": [{"id": c["id"], "name": c["name"]} for c in unsent(camps)],
    }, indent=2))


def e(s):
    return html.escape(str(s or ""), quote=True)


SANS = "font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;"
SERIF = "font-family:'Lora',Georgia,'Times New Roman',serif;"
WRAP = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#EDEDED;"><tr><td style="{pad}">{inner}</td></tr></table>\n'


def card(p):
    img = (f'<tr><td style="padding:0;"><a href="{e(p["link"])}" style="display:block;text-decoration:none;">'
           f'<img src="{e(p["coverImage"])}" alt="" width="550" style="display:block;width:100%;max-width:550px;height:auto;'
           f'border-radius:10px 10px 0 0;border:0;" /></a></td></tr>') if p.get("coverImage") else ""
    inner = (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" '
        'style="background-color:#FFFFFF;border:1px solid #DCC0A0;border-radius:10px;">'
        f'{img}<tr><td style="padding:18px 22px 22px;">'
        f'<h2 style="margin:0 0 8px;{SERIF}color:#2C2C54;font-size:20px;line-height:1.25;font-weight:700;">'
        f'<a href="{e(p["link"])}" style="color:#2C2C54;text-decoration:none;">{e(p["title"])}</a></h2>'
        f'<p style="margin:0 0 14px;font-size:14px;color:#5C5248;line-height:1.5;{SANS}">{e(p["description"])}</p>'
        f'<a href="{e(p["link"])}" style="color:#AF4C2A;font-size:14px;font-weight:600;text-decoration:none;{SANS}">Read the post &rarr;</a>'
        '</td></tr></table>'
    )
    return WRAP.format(pad="padding:0 24px 18px;", inner=inner)


def heading(text):
    return WRAP.format(pad="padding:14px 32px 10px;", inner=(
        f'<p style="margin:0;font-size:12px;color:#8A7E74;letter-spacing:0.08em;text-transform:uppercase;{SANS}">{e(text)}</p>'))


def working_on(items):
    rows = "".join(
        f'<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#5C5248;{SANS}">'
        f'<strong style="color:#2C2C54;">'
        + (f'<a href="{e(i["link"])}" style="color:#2C2C54;">{e(i["title"])}</a>' if i.get("link") else e(i["title"]))
        + f'.</strong> {e(i["blurb"])}</p>'
        for i in items)
    return WRAP.format(pad="padding:0 32px 18px;", inner=rows)


def body_html(c):
    out = WRAP.format(pad="padding:24px 32px 4px;", inner=(
        f'<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#5C5248;{SANS}">{e(c["intro"])}</p>'))
    # Jordan wants "what I'm working on" to lead the issue, ahead of the posts.
    if c.get("working_on"):
        out += heading("What I'm working on") + working_on(c["working_on"])
    if c.get("posts"):
        out += heading("New on the blog") + "".join(card(p) for p in c["posts"])
    return out


def num(c):
    return f"{int(c['number']):03d}"


def issue_dir(c):
    d = OUT / f"mission-control-{num(c)}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def render(c):
    body = body_html(c)
    d = issue_dir(c)
    (d / "body.html").write_text(body)
    # Approximate Listmonk's render for review; real placeholders only exist inside Listmonk.
    tpl = TEMPLATE.read_text()
    preview = (tpl.replace('{{ template "content" . }}', body)
               .replace("{{ .Campaign.Name }}", e(c["subject"]))
               .replace('{{ Date "January 2, 2006" }}', date.today().strftime("%B %-d, %Y"))
               .replace("{{ UnsubscribeURL }}", "#").replace("{{ TrackView }}", ""))
    (d / "preview.html").write_text(preview)
    rel = (d / "preview.html").relative_to(Path.home() / "ClaudeCode")
    print(f"http://jordans-mac-mini:3008/{rel}")


def push(c):
    d = issue_dir(c)
    if (d / "campaign-id").exists():
        sys.exit(f"Refusing: issue {c['number']} already has a Listmonk campaign ({(d / 'campaign-id').read_text()})")
    if pending := unsent(mc_campaigns()):
        sys.exit(f"Refusing: Mission Control already has an unsent campaign: {[p['id'] for p in pending]}")
    body = (d / "body.html").read_text()
    r = api("/api/campaigns", {
        "name": f"Mission Control {num(c)}", "subject": c["subject"],
        "lists": [LIST_ID], "from_email": FROM, "type": "regular",
        "content_type": "html", "body": body, "template_id": TEMPLATE_ID, "messenger": "email",
    })["data"]
    (d / "campaign-id").write_text(str(r["id"]))
    print(f"Draft {r['id']} ({r['status']}): {LISTMONK}/admin/campaigns/{r['id']}")


def test(c):
    cid = int((issue_dir(c) / "campaign-id").read_text())
    camp = api(f"/api/campaigns/{cid}")["data"]
    if camp["status"] != "draft":
        sys.exit(f"Campaign {cid} is {camp['status']}, not draft")
    # The test endpoint renders the body in the payload, not the stored one, so send it all.
    keep = ("name", "subject", "from_email", "content_type", "body", "template_id", "messenger", "type")
    api(f"/api/campaigns/{cid}/test", {**{k: camp[k] for k in keep},
        "lists": [LIST_ID], "subscribers": [TEST_TO]})
    print(f"Test queued to {TEST_TO} (check docker logs listmonk-app if it doesn't arrive)")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "gather":
        gather()
    elif cmd in ("render", "push", "test") and len(sys.argv) == 3:
        globals()[cmd](json.loads(Path(sys.argv[2]).read_text()))
    else:
        sys.exit(__doc__)
