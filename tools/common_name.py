#!/usr/bin/env python3

import os
import sys
import json
import glob
import yaml
from pathlib import Path


# "../USen.Product.100/StaticMsg/AttachmentCommonName.msyt"
common_name_path = sys.argv[1]
# "../../objmap-totk/public/game_files/names.json"
names_path = sys.argv[2]


class ActorLoader:
    def __init__(self, work, rescom):
        self.work = work
        self.rescom = rescom

    def load_json(self, files):
        file = files[0]
        if not os.path.exists(file):
            file = files[1]
            if not os.path.exists(file):
                raise ValueError("file does not exist", file)
        f = open(file, "r")
        return json.load(f)

    def load_file(self, file, fix_path=True):
        if fix_path:
            file = self.get_path(file)
        raw = self.load_json(file)
        root = raw.get("RootNode")
        if root is None:
            print(raw)
            raise ValueError("RootNode does not exist in", file)
        parent_file = root.get("$parent")
        if parent_file:
            parent = self.load_file(parent_file)
            root = merge(parent, root)
        return root

    def get_path(self, file):
        WORK = self.work  # paths['WORK']
        RESCOM = self.rescom  # paths['RESCOM']
        file = file.replace(".gyml", ".json").replace(".bgyml", ".json")
        work = file.replace("Work/", f"{WORK}/").replace("?", f"{WORK}/", 1)
        rescom = file.replace("Work/", f"{RESCOM}/").replace("?", f"{RESCOM}/", 1)
        return [work, rescom]


from functools import reduce


def merge(a, b, path=None):
    "merges b into a"
    if path is None:
        path = []
    for key in b:
        if key in a:
            if isinstance(a[key], dict) and isinstance(b[key], dict):
                merge(a[key], b[key], path + [str(key)])
            elif a[key] == b[key]:
                pass  # same leaf value
            else:
                # raise Exception('Conflict at %s' % '.'.join(path + [str(key)]))
                a[key] = b[key]
        else:
            a[key] = b[key]
    return a


class Actor:
    def __init__(self, param_file, loader):
        self._param_file = str(param_file)
        self.ActorParam = loader.load_file([self._param_file, ""], fix_path=False)

    def read_component(self, component_name, loader):
        components = self.ActorParam.get("Components")
        if not components:
            return False
        component = components.get(component_name)
        if not component:
            return False
        data = loader.load_file(component)
        components[component_name] = data
        components[component_name]["_file"] = component
        return True

    def getPath(self, path):
        parts = path.split("/")
        ref = self.__dict__
        for part in parts:
            tmp = ref.get(part)
            if not tmp:
                return None
            ref = tmp
        return tmp

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=2)

    def readDropTables(self, loader):
        if not self.read_component("DropRef", loader):
            return None
        rsclist = self.ActorParam["Components"]["DropRef"]["DropTableResourceList"]
        tables = []
        for rsc in rsclist:
            table = loader.load_file(rsc)
            if not "DropTableName" in table:
                table["DropTableName"] = ""
            els = table.get("DropTableElementResourceList")
            table["items"] = [loader.load_file(el) for el in els]
            tables.append(table)
        return tables
g

with open(common_name_path, "r") as f:
    CommonName = yaml.load(f, Loader=yaml.FullLoader)
    CommonName = CommonName["entries"]
Names = json.load(open(names_path, "r"))

RESCOM = Path(".") / "Pack" / "ResidentCommon"

names = {}
for actor in glob.glob(str(Path(".") / "Pack" / "Actor" / "*")):
    loader = ActorLoader(Path(actor), RESCOM)
    actor = Path(actor).name
    parm = Path(loader.work) / "Actor" / f"{actor}.engine__actor__ActorParam.json"
    if not os.path.exists(parm):
        continue
    item = Actor(parm, loader)
    item.read_component("AttachmentRef", loader)
    cname = item.getPath("ActorParam/Components/AttachmentRef/CommonName")
    adj = f"{cname}_Adjective"
    cname = f"{cname}_Name"
    nameref = item.getPath("ActorParam/Components/ActorNameRef")
    if actor in Names:
        pass
    elif nameref:
        actor_ref = nameref.split("/")[-1].split(".")[0]
        if actor_ref in Names:
            names[actor] = Names[actor_ref]
    elif cname in CommonName:
        contents = CommonName[cname]["contents"]
        text = " ".join([v["text"] for v in contents])
        if text == "Iron Ball" and "IronBall" not in actor:
            # Object here are set from the Default value CommonName
            #  but are not really Iron Balls
            continue
        # print("Using common name", actor, text)
        names[actor] = text
    else:
        print("Missing", actor)
        continue
    # print(names[actor])
names = dict(sorted(names.items()))
json.dump(names, open("names_extra.json", "w"), indent=2)
