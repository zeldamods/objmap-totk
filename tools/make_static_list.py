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
    "ShopGeneral": "ShopYorozu",
    "ShopInn": "ShopYadoya",
    "ShopJewelry": "ShopJewel",
    "Stable": "Hatago",
    "Shrine": "Dungeon",
    "Tower": "Tower",
    "Labo": "Labo",
    "DragonTears": "Tear",
    "CheckPoint": "Lightroot",
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
markers['Place'] = []

# Multiple locations exist for Cities and Stables
skips = {
    'TabantaHatago': [1],
    'NewHyruleWestHatago': [0],
    'FaronHatago000': [0],
    'Gerudo': [0, 1],
}

chasms_not_caves = [
    'Cave_HyruleRidge_0004',
    'Cave_GerudoDesert_0043',
    'Cave_Lanayru_0050',
    'Cave_Lanayru_0063'
]

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
                if msg in skips and i in skips[msg]:
                    continue
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

                if msg in ['AncientLabo','HatenoLabo']:
                    item['Icon'] = 'Labo'
                    markers['Labo'].append(item)
                elif "DeepHole" in msg:
                    item['Icon'] = 'Chasm'
                    markers['Chasm'].append(item)
                elif msg == 'Bar':
                    item['Icon'] = 'Drink'
                    markers['Shop'].append(item)
                elif 'Shop' in msg and item_kind == 'Location':
                    if not msg.startswith('SmeltShopGolem'): # Forge Construct
                        if msg in ['ScrapShop', 'RentalZarashiShop_Gerudo', 'RentalZarashiShop_GerudoDesert']:
                            item['Icon'] = 'Star'
                        elif 'BatteryExchangeShop_' in msg:
                            item['Icon'] = 'Battery'
                        else:
                            item['Icon'] = 'ShopBougu'
                        markers['Shop'].append(item)
                elif 'FigureGallery' == msg: # Monster Gallery
                    #item['Icon'] = 'ShopBougu'
                    #markers['Shop'].append(item)
                    pass
                elif 'HorseStableBranch' in msg:
                    item['Icon'] = 'Hatago'
                    markers['Place'].append(item)
                elif msg in chasms_not_caves:
                    item['Icon'] = 'Chasm'
                    markers['Chasm'].append(item)
                elif 'DemonStatue' in msg:
                    if msg.startswith('DemonStatue'):
                        item['Icon'] = 'Bargainer'
                        if msg == 'DemonStatue_01':
                            msg = 'MinusField_AncientTimeShrine'
                        elif msg == 'DemonStatue_02':
                            msg = 'MinusField_KingValley'
                        elif msg == 'DemonStatue_00' and item['ShowLevel'] == 'Farthest':
                            continue
                        item['MessageID'] = msg
                        markers['Place'].append(item)
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
            if pt[1] >= 750:
                map_name = 'Sky'
            if key in ['6577590198901788531','2587961335290322890','3494902862536172994']:
                map_name = 'Sky'
            if key in ['15262678164833260129', '18194949317466592174']:
                map_name = 'Surface'
            items.append({
                'id': key,
                'Translate': { 'X': pt[0], 'Y': pt[1], 'Z': pt[2] },
                'hash_id': key,
                'map_static': 1,
                'map_name': map_name,
                'map_type': 'Totk'
            })
    markers['Korok'].extend(items)

markers['Dispensers'] = []
rboxes =json.load(open('tools/rbox.json', 'r'))
for rbox in rboxes:
    pt = rbox['data']['Translate']
    msg = rbox['unit_config_name'],
    markers['Dispensers'].append({
        'MessageID': msg,
        'id': rbox['hash_id'],
        'Icon': 'Dispenser',
        'Priority': 1,
        'Translate': { 'X': pt[0], 'Y': pt[1], 'Z': pt[2] },
        'hash_id': rbox['hash_id'],
        'SaveFlag': f'Location_{msg}',
        'equip': rbox['equip'],
        'ui_equip': rbox['ui_equip'],
        'map_name': rbox['map_name'],
        'map_static': rbox['map_static'],
        'map_type': 'Totk',
    })

# The Bargainer Statue does not appear to be in the LocationArea
#  Adding it here
markers['Place'].append({
    'MessageID': 'DemonStatue_01',
    'Priority': 1,
    'Translate': {'X': -251, 'Y': 125, 'Z': -154.39 },
    'SaveFlag': 'Location_DemonStatue_01',
    'Icon': 'Bargainer',
})

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
json.dump(out, open("static.json", "w"), indent=2)
print("==> static.json")
