#!/usr/bin/env python3

import json
from pathlib import Path

NAMES = json.load(open("names.json","r"))


def get_component(par, name, base):
    common_path = Path('Pack') / 'ResidentCommon'
    if 'Components' in par and name in par['Components']:
        # Remove leading '?' and match locally or globally
        file = par['Components'][name].replace("?", "").replace(".bgyml",".json")
        if file == "":
            return None, None
        local = base / file
        if local.exists():
            return local, base
        common = common_path / file
        if common.exists():
            return common, base
        return None, None

    if not '$parent' in par:
        return None, None
    # Remove leading 'Work/' and match locally or globally (for the parent)
    stub = par['$parent'].replace("Work/", "").replace(".gyml",".json")
    local = base / stub
    if local.exists():
        parent = json.load(open(local,"r"))['RootNode']
        return get_component(parent, name, base)

    common = common_path / stub
    if common.exists():
        parent = json.load(open(common,"r"))['RootNode']
        return get_component(parent, name, common_path)

    return None, None

p = Path("Pack/Actor")

horns = {}

for actor in p.glob("*"):
    name = actor.name
    file = str(actor.name) + ".engine__actor__ActorParam.json"

    actor_path = actor / 'Actor' / file
    if not actor_path.exists():
        continue
    actor_par = json.load(open(actor_path, "r"))['RootNode']

    # GameParameterTableRef
    gp_path, actor = get_component(actor_par, "GameParameterTableRef", actor)
    if not gp_path:
        continue

    gp = json.load(open(gp_path, "r"))['RootNode']

    # HornTypeAndAttachmentMappingTable
    horn_path, actor = get_component(gp, 'HornTypeAndAttachmentMappingTable', actor)
    if not horn_path:
        continue

    horn = json.load(open(horn_path, "r"))['RootNode']

    attachments = horn['HornTypeAndAttachmentMapping']
    # Frox are the only ones with 2 horns, they are the same
    #    Just assume its one
    if name.startswith("FldObj_"): # Ignore Figure of Enemies
        continue
    for attach in attachments[:1]: 
        attach_type = attach.get('HornType') or "Default"
        attach_name = attach.get('AttachmentName') or "NoHorn"
        attach_name = attach_name.split("/")[-1].split(".")[0]
        ui_name = NAMES.get(attach_name) or attach_name
        ui_actor_name = NAMES.get(name) or name
        horns[name] = {
            "ui_actor_name": ui_actor_name,
            "ui_name": ui_name,
            "name": name,
            "attach_name": attach_name,
        }

horn_material = {}
for key in sorted(horns.keys()):
    val = horns[key]
    horn_material[val['name']] = val['attach_name']

print(json.dumps(horn_material, indent=2))

