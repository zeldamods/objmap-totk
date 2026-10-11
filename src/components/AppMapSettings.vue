<template>
  <section>

    <h4 class="subsection-heading">Map</h4>
    <select class="custom-select custom-select-sm mb-2" v-model="s.mapType" @input="resetMapName">
      <option v-for="o in optionsMapType" :key="o.value" :value="o.value">{{o.text}}</option>
    </select>
    <select class="custom-select custom-select-sm mb-2" v-model="s.mapName">
      <option v-for="o in optionsMapNameForMapType[s.mapType]" :key="o.value" :value="o.value">{{o.text}}</option>
    </select>
    This setting only affects search. Objects will be displayed using the main Hyrule map.
    <hr>

    <h4 class="subsection-heading">Object Color Mode</h4>
    <div role="radiogroup" class="mb-4">
      <div class="custom-control custom-radio custom-control-inline">
        <input type="radio" class="custom-control-input" name="settings-color-model" id="settings-color-per-actor" value="per-actor" v-model="colorMode" @change="onColorModeChange(colorMode)">
        <label class="custom-control-label" for="settings-color-per-actor">Color by actor type</label>
      </div>
      <div class="custom-control custom-radio custom-control-inline">
        <input type="radio" class="custom-control-input" name="settings-color-model" id="settings-color-per-group" value="per-group" v-model="colorMode" @change="onColorModeChange(colorMode)">
        <label class="custom-control-label" for="settings-color-per-group">Color by search group</label>
      </div>
    </div>
    <h4 class="subsection-heading">Object Display</h4>
    <p class="mb-1">Some changes only take effect after a reload.</p>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-actor-names" v-model="s.useActorNames">
      <label class="custom-control-label" for="settings-actor-names">Use internal actor names</label>
    </div>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-hex-hash-ids" v-model="s.useHexForHashIds">
      <label class="custom-control-label" for="settings-hex-hash-ids">Show hash IDs in hex</label>
    </div>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-tooltip-y" @change="toggleY">
      <label class="custom-control-label" for="settings-tooltip-y">Show object heights in tooltips</label>
    </div>
    <hr>
    <section>
      <h4 class="subsection-heading">Use In-Game Coordinates</h4>
      <div class="custom-control custom-switch">
        <input type="checkbox" class="custom-control-input" id="settings-in-game-coordinates" v-model="s.inGameCoordinates">
        <label class="custom-control-label" for="settings-in-game-coordinates">Display Coordinates as those In-Game</label>
      </div>
      <p class="small">
        Coordinates here are displayed as East-West, Vertical, North-South (x,z,y). This option converts the coordinates to match those In-Game as East-West, North-South, Vertical - 106 meters (x,y,z).
      </p>
    </section>
    <hr>
    <section>
      <h4 class="subsection-heading">Custom Search Presets</h4>
      <div class="d-flex mb-1" v-for="(preset, idx) in s.customSearchPresets" :key="idx">
        <input placeholder="Label" style="flex: 4" class="form-control form-control-sm mr-2" v-model="s.customSearchPresets[idx][0]">
        <input placeholder="Query" style="flex: 6" class="form-control form-control-sm mr-2" v-model="s.customSearchPresets[idx][1]">
        <button type="buttom" class="btn btn-danger btn-sm" @click="s.customSearchPresets.splice(idx, 1)"><i class="fa fa-trash"></i></button>
      </div>
      <button type="button" class="btn btn-secondary btn-sm mt-2" @click="s.customSearchPresets.push(['', ''])"><i class="fa fa-plus"></i> Add</button>
    </section>
    <hr>
    <h4 class="subsection-heading">Copy Coordinates</h4>
    
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-copy-coordinates-xyz" v-model="s.copyCoordinatesXYZ">
      <label class="custom-control-label" for="settings-copy-coordinates-xyz">Copy (x,y,z) instead of (x,z).</label>
    </div>
    <p class="small">
      Result of 'Copy coordinates' in the map's context menu, right click, returns (x,y,z) instead of (x,z). Value of y (height) is defined by the active layer.
    </p>
    <h4 class="subsection-heading">Map Drawing</h4>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-no-touch-screen" v-model="s.noTouchScreen">
      <label class="custom-control-label" for="settings-no-touch-screen">Not using a touch screen</label>
    </div>
    <p class="small">
      Allows for clicking and dragging during line creation and markers are a more reasonable size. Reload the page for setting to take effect.
    </p>
  </section>
</template>
<script src="./AppMapSettings.ts"></script>
