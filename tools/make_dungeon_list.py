#!/usr/bin/env python3

import yaml
import json
import sys

base = sys.argv[1]

with open(f"{base}/USen.Product.100/LocationMsg/Dungeon.msyt","r") as f:
    data = yaml.load(f, Loader=yaml.FullLoader)

out = {}

for v, val in data['entries'].items():
    if v.startswith("Ref_"):
        continue
    if v.startswith("2"):
        id = v[1:]
        out[f'Dungeon{id}_sub'] = val['contents'][0]['text']
    if v.startswith("0"):
        id = v[1:]
        out[f'Dungeon{id}'] = val['contents'][0]['text']
        out[f'Dungeon{id}_master'] = val['contents'][0]['text'].replace(" Shrine", "")

out['_doc_'] = {
    'path': 'objmap/public/game_files/text/Dungeon.json',
    'created': 'make_dungeon_list.py',
    'input_files': [
        'USen.Product.100/LocationMsg/Dunggeon.msyt',
    ],
    'notes': 'msyt files created by msyt export file.msbt. Modified version in 2023-05-22 to accomdate variation in totk data structures',
}
json.dump(out, open("Dungeon.json",'w'))
print("==> Dungeons.json")
