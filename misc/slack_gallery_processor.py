# Given a slack channel export folder,
# consolidate into a single JSON file of top level posts,
# and download all the attached files for each

# Currently the user id -> name mapping part might be broken but that's a trifle

import json
import os
from datetime import datetime
import requests
from pathlib import Path
import re

class SlackGalleryProcessor:
    def __init__(self, data_dir, output_dir):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.media_dir = self.output_dir / "media"
        self.media_dir.mkdir(parents=True, exist_ok=True)

    def process_files(self):
        gallery_data = {"posts": []}


        # Get all JSON files and sort by date
        json_files = sorted([f for f in self.data_dir.glob("*.json")
                           if re.match(r"\d{4}-\d{2}-\d{2}\.json", f.name)])

        for json_file in json_files:
            with open(json_file) as f:
                day_data = json.load(f)

            # Process each top-level message
            for msg in day_data:
                if self.is_valid_post(msg):
                    post = self.process_post(msg)
                    if post:
                        gallery_data["posts"].append(post)

        # Write output
        with open(self.output_dir / "gallery_data.json", "w") as f:
            json.dump(gallery_data, f, indent=2)

    def is_valid_post(self, msg):
        # Check if message is a top-level post (not a reply or system message)
        return (
            isinstance(msg, dict) and
            "subtype" not in msg and
            "thread_ts" in msg and
            msg.get("ts") == msg.get("thread_ts")
        )

    def process_post(self, msg):
        # Convert timestamp to ISO format
        ts = float(msg["ts"])
        dt = datetime.fromtimestamp(ts)

        name = self.get_user_name(msg["user"])

        # Process media files
        media = []
        if "files" in msg:
            for file in msg["files"]:
                media_item = self.process_media(file)
                if media_item:
                    media.append(media_item)

        return {
            "id": msg["ts"],
            "timestamp": dt.isoformat(),
            "month": dt.strftime("%Y-%m"),
            "creator": name,
            "content": {
                "text": msg.get("text", ""),
                "media": media
            },
        }

    def process_media(self, file):
        file_id = file["id"]
        url = file.get("url_private_download")
        if not url:
            return None

        # Determine file type and path
        file_type = file["filetype"].lower()
        file_name = f"{file_id}.{file_type}"
        rel_path = f"media/{file_name}"

        media_item = {
            "url": url,
            "location": rel_path,
            "type": file_type,
            "name": file["name"],
            "mime_type": file["mimetype"]
        }

        # Add thumbnail if available
        if "thumb_360" in file:
            media_item["thumbnail_url"] = file["thumb_360"]

        # Download file
        self.download_file(url, self.media_dir / file_name)

        return media_item

    def download_file(self, url, path):
        response = requests.get(url)
        with open(path, "wb") as f:
            f.write(response.content)

    def get_user_name(self, user_id):
        # Load user data if not already loaded
        if not hasattr(self, 'user_data'):
            with open('users.json') as f:
                self.user_data = json.load(f)

        # Look up user and return their real name, or user ID if not found
        if user_id in self.user_data:
            return self.user_data[user_id]['real_name']
        return user_id

if __name__ == "__main__":
    processor = SlackGalleryProcessor("slack_export", "gallery_output")
    processor.process_files()
    print("Gallery data processed and saved to gallery_output/")