#!/usr/bin/env python3

import yaml
import json
import sys

base = sys.argv[1]

# 1  ./make_names_list.py
#     - Game data files
#     - missing.csv
# 2  copy names.json to objmap and radar
# 3  ts-node ./build.ts -d ./path/to/map/data/files
# 4  ./check_names.py
#      Generates an updated mising.csv file
# 5  Update missing.csv by hand or stop
# 6  goto 1

endswith = ['_BaseName', '_InstantTips', '_Adjective', '_Caption']
skip_alias = ['Npc_Goron', 'Obj_AutoBuilderDraft', 'Ganondorf']

out = {}
for file in ["USen.Product.100/ActorMsg/Attachment.msyt",
             "USen.Product.100/ActorMsg/AutoBuilderDraft.msyt",
             "USen.Product.100/ActorMsg/Boss.msyt",
             "USen.Product.100/ActorMsg/CharaDirectory.msyt",
             "USen.Product.100/ActorMsg/Horse.msyt",
             "USen.Product.100/ActorMsg/LinkHouse.msyt",
             "USen.Product.100/ActorMsg/Nickname.msyt",
             "USen.Product.100/ActorMsg/Npc.msyt",
             "USen.Product.100/ActorMsg/PictureBook.msyt",
             "USen.Product.100/ActorMsg/PouchContent.msyt",
             "USen.Product.100/ActorMsg/SheikahCameraTarget.msyt"
             ]:
    with open(f"{base}/{file}","r") as f:
        data = yaml.load(f, Loader=yaml.FullLoader)

    for v, val in data['entries'].items():
        skip = any([v.endswith(value) for value in endswith])
        if skip:
            continue;
        if '_Caption_' in v:
            continue
        if not v.endswith('_Name') and not v.endswith('_Alias') and not 'Nickname' in file:
            print(v, val, file)
            continue
        isAlias = v.endswith('_Alias')
        v = v.replace('_Name','').replace('_Alias','')

        if not 'text' in val['contents'][0]:
            if len(val['contents']) > 1:
                txt = val['contents'][1]['text']
        else:
            txt = val['contents'][0]['text']

        # Check for repeated key/values
        if v in out and out[v] != txt:
            if isAlias or any([value in v for value in skip_alias]):
                continue
            #print(f"{v:35}: {out[v]:35} <> {txt:35}", isAlias, v)

        out[v] = txt

with open("tools/names_extra.json","r") as f:
    extra = json.load(f)
    for key, val in extra.items():
        if key not in out:
            out[key] = val

missing = []

with open("missing.csv", "r") as f:
    for line in f:
        if len(line.strip()) == 0:
            continue
        if line.strip()[0] == '#':
            continue
        v = [x.strip() for x in line.split(",")]
        key, val = v[0], v[1]
        if val == "":
            continue
        if val[0] == '$':
            val = val[1:]
            if val in out:
                if not key in out:
                    out[key] = out[val]
                else:
                    print(key, val)
            else:
                raise ValueError('value does not exist', val)
        else:
            if not key in out:
                out[key] = val
            else:
                print(key, val)

out['_doc_'] = {
    'path': 'objmap/public/game_files/names.json',
    'created': 'make_names_list.py',
    'input_files': [
        "USen.Product.100/ActorMsg/PictureBook.msyt",
        "USen.Product.100/ActorMsg/NPC.msyt",
        "USen.Product.100/ActorMsg/CharaDirectory.msyt",
        "USen.Product.100/ActorMsg/PouchContent.msyt"
        'missing.csv',
    ],
    'notes1': 'msyt files created by msyt export file.msbt. Modified version in 2023-05-22 to accomdate variation in totk data structures',
    'notes2': 'missing.csv created by comparing unit_config_names from map.db (radar/build.ts) to names and outputting the missing values; check top of mssing.csv for more details and format',
}

json.dump(dict(sorted(out.items())), open("names.json",'w'), indent=2)
print("==> names.json")
