<template>
  <section>

    <h4 class="subsection-heading">Map</h4>
    <b-form-select v-model="s.mapType" class="mb-2" size="sm" :options="optionsMapType" @input="resetMapName"></b-form-select>
    <b-form-select v-model="s.mapName" class="mb-2" size="sm" :options="optionsMapNameForMapType[s.mapType]"></b-form-select>
    This setting only affects search. Objects will be displayed using the main Hyrule map.
    <hr>

    <h4 class="subsection-heading">Object Color Mode</h4>
    <b-radio-group class="mb-4" v-model="colorMode" @change="onColorModeChange">
      <b-radio value="per-actor">Color by actor type</b-radio>
      <b-radio value="per-group">Color by search group</b-radio>
    </b-radio-group>
    <h4 class="subsection-heading">Object Display</h4>
    <p class="mb-1">Some changes only take effect after a reload.</p>
    <b-checkbox switch v-model="s.useActorNames">Use internal actor names</b-checkbox>
    <b-checkbox switch v-model="s.useHexForHashIds">Show hash IDs in hex</b-checkbox>
    <b-checkbox switch  @change="toggleY">Show object heights in tooltips</b-checkbox>
    <hr>
    <section>
      <h4 class="subsection-heading">Custom Search Presets</h4>
      <div class="d-flex mb-1" v-for="(preset, idx) in s.customSearchPresets" :key="idx">
        <input placeholder="Label" style="flex: 4" class="form-control form-control-sm mr-2" v-model="s.customSearchPresets[idx][0]">
        <input placeholder="Query" style="flex: 6" class="form-control form-control-sm mr-2" v-model="s.customSearchPresets[idx][1]">
        <b-btn size="sm" variant="danger" @click="s.customSearchPresets.splice(idx, 1)"><i class="fa fa-trash"></i></b-btn>
      </div>
      <b-btn class="mt-2" size="sm" @click="s.customSearchPresets.push(['', ''])"><i class="fa fa-plus"></i> Add</b-btn>
    </section>
    <hr>
    <h4 class="subsection-heading">Map Drawing</h4>
    <b-checkbox switch v-model="s.noTouchScreen">Not using a touch screen</b-checkbox>
    <p class="small">
      Allows for clicking and dragging during line creation and markers are a more reasonable size. Reload the page for setting to take effect.
    </p>
  </section>
</template>
<script src="./AppMapSettings.ts"></script>
