#!/usr/bin/env python3

# #!/usr/bin/env bash
# ROMFSDIR='/path/to/totk-romfs'
# MAPSRC="$ROMFSDIR/UI/Map"
# TXTMPDIR="txtmp"

# mkdir -p "$TXTMPDIR/sourcetiles"
# mkdir -p "$TXTMPDIR/pngtiles"
# ls "$MAPSRC/MainField/" | grep -E '._..-.._00(_T+)?(_A)*\.bntx(\.zs)?' | xargs -I {} cp "$MAPSRC"/MainField/{} "$TXTMPDIR"/sourcetiles
# # A few dupes get through because grep can't be greedy about the set of emitted lines. We only keep final map states
# rm -f "$TXTMPDIR"/sourcetiles/G_09-04_00_T.bntx*
# rm -f "$TXTMPDIR"/sourcetiles/G_10-08_00_T.bntx*
# rm -f "$TXTMPDIR"/sourcetiles/G_11-05_00_T.bntx*
# rm -f "$TXTMPDIR"/sourcetiles/G_11-07_00_T.bntx*
# rm -f "$TXTMPDIR"/sourcetiles/S_05-06_00_T_A.bntx*
# rm -f "$TXTMPDIR"/sourcetiles/S_09-04_00_T_A.bntx*

# # Expect manual extraction into $TXTMPDIR/pngtiles:
# # - Use switch toolbox https://github.com/KillzXGaming/Switch-Toolbox
# # - Tools -> Batch Export Textures (All Supported Formats)
# # - Go to $TXTMPDIR/sourcetiles, select all bntx, open, select output dir $TXTMPDIR/pngtiles
# # - Choose png format, uncheck Use Folders, confirm and wait for all 360 files, 142MB bntx.zs -> 1.2GB png

# Drop all suffixes for predictable filenames
# for f in "$TXTMPDIR"/pngtiles/*.png; do
#   canon=$(echo "$f" | sed -Ee s/_T+// -e s/\(_A\)+// );
#   mv -f "$f" "$canon" 2> /dev/null
# done


from PIL import Image
import os
Image.MAX_IMAGE_PIXELS = None  # else it screams if we do anything hard...? lol
TXTMPDIR="txtmp"
GAME_FILES="../public/game_files"

def stitch_area(area):
    output = Image.new('RGB', (12*3000,10*3000))

    for x in range(12):
        xx = str(x).zfill(2)
        for z in range(10):
            zz = str(z).zfill(2)
            pngname = f"{area}_{xx}-{zz}_00.png"
            pngname = os.path.join(TXTMPDIR, "pngtiles", pngname)
            print(pngname)
            with Image.open(pngname) as tile:
                output.paste(tile, (x*3000, z*3000))

    outfilename = os.path.join(TXTMPDIR, f"{area}_full_map.png")
    print(f"exporting {outfilename}")
    output.save(outfilename, "PNG")
    output.close()

# output ground 351MB, sky 262MB, underground 275MB, 36000px * 30000px each
stitch_area("G")
stitch_area("S")
stitch_area("U")


# zoom level max tiles:
# min 2: https://objmap-totk.zeldamods.org/game_files/map//Sky/maptex/2/2/2.webp
#        https://objmap-totk.zeldamods.org/game_files/map//Sky/maptex/3/5/4.webp
#        https://objmap-totk.zeldamods.org/game_files/map//Sky/maptex/4/11/9.webp
#        https://objmap-totk.zeldamods.org/game_files/map//Sky/maptex/5/23/19.webp
#        https://objmap-totk.zeldamods.org/game_files/map//Sky/maptex/6/46/39.webp
# max 7: https://objmap-totk.zeldamods.org/game_files/map//Sky/maptex/7/93/78.webp
#
# 256*xchunk*scalingfactor - xpadding*scalingfactor = 36000
# 256*ychunk*scalingfactor - ypadding*scalingfactor = 30000
#
# px paddings, solve for scale:
# zoom 2: 18, 143, scale=48
# zoom 3: 36, 30, scale=24
# zoom 4: 72, 169, scale=12
# zoom 5: 144, 120, scale=6
# zoom 6: 32, 240, scale=3
# zoom 7: 64, 224, scale=1.5

ZOOM_SCALES = (None, None, 48.0, 24.0, 12.0, 6.0, 3.0, 1.5)
ZOOMS = (2, 3, 4, 5, 6, 7)


AREAMAP = {
    'G': "Ground",
    'S': "Sky",
    'U': "Depths",
}

for area in "GSU":
    full_area_map = Image.open(os.path.join(TXTMPDIR, f"{area}_full_map.png"))
    for zoom in ZOOMS:
        zs = ZOOM_SCALES[zoom]
        zoomed_area_map = full_area_map.resize((int(36000/zs), int(30000/zs)))
        xpad = 256 - zoomed_area_map.size[0] % 256
        ypad = 256 - zoomed_area_map.size[1] % 256
        zoomed_output = Image.new('RGBA', (zoomed_area_map.size[0]+xpad, zoomed_area_map.size[1]+ypad))
        zoomed_output.paste(zoomed_area_map)
        xtiles, ytiles = int(zoomed_output.size[0]/256), int(zoomed_output.size[1]/256)

        for x in range(xtiles):
            for y in range(ytiles):
                path = f"{GAME_FILES}/map/{AREAMAP[area]}/maptex/{zoom}/{x}/{y}.webp"
                print(f"assembling {path}")
                os.system(f"mkdir -p $(dirname {path})")
                left = x*256
                right = x*256 + 256
                upper = y*256
                lower = y*256 + 256
                outimg = zoomed_output.crop((left, upper, right, lower))
                outimg.save(path, "WEBP")
