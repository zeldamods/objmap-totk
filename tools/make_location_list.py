#!/usr/bin/env python3

import yaml
import json
import sys

base = sys.argv[1]

with open(f"{base}/USen.Product.100/LocationMsg/Location.msyt","r") as f:
    data = yaml.load(f, Loader=yaml.FullLoader)

out = {}

for v, val in data['entries'].items():
    if len(val['contents']) != 1:
        print(v, ">1")
    out[v] = val['contents'][0]['text']
out['_doc_'] = {
    'path': 'objmap/public/game_files/text/LocationMarker.json',
    'created': 'make_location_list.py',
    'input_files': [
        'USen.Product.100/LocationMsg/Location.msyt',
    ],
    'notes': 'msyt files created by msyt export file.msbt. Modified version in 2023-05-22 to accomdate variation in totk data structures',
}

json.dump(out, open("LocationMarker.json",'w'))
print("==> LocationMarker.json")
