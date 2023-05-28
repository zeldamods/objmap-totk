#!/usr/bin/env python3

import json
import sys

base = sys.argv[1]

icons = {
    "CaveEntranceNormal": "Cave",
    "CaveEntranceSpecial": "Cave",
    "CaveEntranceWell": "Cave",
    "City": "Village",
    "ShopArmor": "ShopBougu",
    "ShopDye": "ShopColor",
    "ShopGeneral": "ShopBougu",
    "ShopInn": "ShopYadoya",
    "ShopJewelry": "ShopJewel",
    "Stable": "Hatago",
    "Shrine": "Dungeon",
    "Tower": "Tower",
    "Labo": "Labo",
}
types = {
    "CaveEntranceNormal": "Cave",
    "CaveEntranceSpecial": "Cave",
    "CaveEntranceWell": "Cave",
    "City": "Place",
    "ShopArmor": "Shop",
    "ShopDye": "Shop",
    "ShopGeneral": "Shop",
    "ShopInn": "Shop",
    "ShopJewelry": "Shop",
    "SpotBig": "Location",
    "SpotBigArtifact": "Location",
    "SpotBigMagma": "Location",
    "SpotBigMountain": "Location",
    "SpotBigOther": "Location",
    "SpotBigTimber": "Location",
    "SpotBigWater": "Location",
    "SpotBigWithNameIcon": "Location",
    "SpotMiddle": "Location",
    "SpotMiddleArtifact": "Location",
    "SpotMiddleMagma": "Location",
    "SpotMiddleMountain": "Location",
    "SpotMiddleOther": "Location",
    "SpotMiddleTimber": "Location",
    "SpotMiddleWater": "Location",
    "SpotSmallArtifact": "Location",
    "SpotSmallMagma": "Location",
    "SpotSmallMountain": "Location",
    "SpotSmallOther": "Location",
    "SpotSmallTimber": "Location",
    "SpotSmallWater": "Location",
    "Shrine": "Dungeon",
    "District": "Location",
    "Stable": "Place",
}
out = {}
markers = {}
markers['Labo'] = []
markers['Chasm'] = []
markers['Korok'] = []

for field in ['MainField', 'MinusField']:
    data = json.load(open(f"{base}/Banc/{field}/LocationArea/{field}.locationarea.json","r"))

    for kind, values in data.items():
        item_kind = kind
        if item_kind in types:
            item_kind = types[item_kind]

        items = []
        if kind == "Dungeon":
            continue
        if len(values) == 0:
            continue
        for v in values:
            msg = v['LocationName'].replace("Work/Location/","").split(".")[0]
            if msg == "": # Not sure if this a bug in the data files
                continue
            for i in range(len(v['InstanceID'])):
                pt = v['Trans'][i]
                item = {
                    'MessageID': msg,
                    'Priority': 1,
                    'Translate': {'X': pt[0], 'Y': pt[1], 'Z': pt[2]},
                    'SaveFlag': f'Location_{msg}'
                }
                if kind in icons :
                    item['Icon'] = icons[kind]
                if kind.startswith("Spot") :
                    if 'TargetZoomLevel' in v:
                        item['ShowLevel'] = v['TargetZoomLevel'][i]
                if kind == 'District':
                    item['ShowLevel'] = 'Farthest'
                # Show level is likely based on Spot size

                if "Labo" in msg:
                    item['Icon'] = 'Labo'
                    markers['Labo'].append(item)
                elif "DeepHole" in msg:
                    item['Icon'] = 'Chasm'
                    markers['Chasm'].append(item)
                elif 'Shop' in msg and item_kind == 'Location':
                    #print(msg)
                    item['Icon'] = 'ShopBougu'
                    markers['Shop'].append(item)
                elif 'FigureGallery' == msg:
                    item['Icon'] = 'ShopBougu'
                    markers['Shop'].append(item)
                else:
                    items.append(item)
        if not item_kind in markers:
            markers[item_kind] = []

        markers[item_kind].extend(items)

    data = json.load(open(f"{base}/Banc/{field}/HiddenKorok/{field}.hiddenkorok.json", "r"))
    items = []
    for kind, values in data.items():
        for key, pt in values.items():
            #print(kind, key)
            map_name = 'Surface'
            if pt[1] >= 1000:
                map_name = 'Sky'
            items.append({
                'id': key,
                'Translate': { 'X': pt[0], 'Y': pt[1], 'Z': pt[2] },
                'hash_id': key,
                'map_static': 1,
                'map_name': map_name,
                'map_type': 'Totk'
            })
    markers['Korok'].extend(items)


out['markers'] = markers
out['_doc_'] = {
    'path': 'objmap/public/game_files/map_summary/MainField/static.json',
    'created': 'make_static_list.py',
    'input_files': [
        'Banc/MainField/LocationArea/MainField.locationarea.json',
        'Banc/MinusField/LocationArea/MinusField.locationarea.json',
    ],
    'notes': 'json input files created by decompressing from zstd -D ZsDic/zs.zsdic -d file.byml.zs -o file.byml, then converting to yaml and json with byml_to_yml'
}
json.dump(out, open("static.json", "w"))
print("==> static.json")
