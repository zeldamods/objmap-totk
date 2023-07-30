<template>
  <div :class="className + (isStatic ? ' static' : '')">
    <section class="search-result-name">{{name(true)}}</section>
    <section class="search-result-location">
      <span v-if="obj.map_name.startsWith('Sky')"> <i class="fa fa-cloud fa-fw" style="color: lightblue"></i></span>
      <span v-else-if="obj.map_name.startsWith('Cave')"> <i class="fas fa-archway fa-fw" style="color: rosybrown"></i></span>
      <span v-else-if="obj.map_type === 'MainField'"> <i class="fa fa-tree fa-fw" style="color: lightgreen"></i></span>
      <span v-else-if="obj.map_type === 'MinusField'"> <i class="fa fa-circle fa-fw" style="color: #F3B4F6;"></i></span>
      <i v-else class="fa fa-map-marker-alt fa-fw"></i>
      {{getMapNameForObj(data)}}
    </section>
    <section class="search-result-id">
      <i class="fas fa-hashtag fa-fw"></i> ID
      <span v-if="withPermalink"><router-link :to="{ query: { id: `${data.map_type},${data.map_name},${data.hash_id}` } }"
                                              :key="`${data.map_type},${data.map_name},${data.hash_id}`"
                                              append>{{formatObjId(data.hash_id)}}</router-link></span>
      <span v-if="!withPermalink">{{formatObjId(data.hash_id)}}</span>
      <b-btn class="checkmark-btn" @click.stop.prevent="toggleCheck()" title="Mark as found or not">
        <span v-if="isChecked">
          <i class="fa fa-check-circle fa-fw" style="color: white; padding-left: 1em; padding-right:0.5em"></i>
        </span>
        <span v-else>
          <i class="fa fa-check-circle fa-fw" style="color: rgba(255,255,255,0.25); padding-left: 1em; padding-right: 0.5em"></i>
        </span>
      </b-btn>
    </section>
    <section class="search-result-hard-mode">
      <span style="color: #ff3915" v-if="data.hard_mode"><i class="fa fa-dungeon fa-fw"></i> Master Mode</span>
    </section>
    <section class="search-result-oho">
      <span style="color: #ff3915" v-if="data.one_hit_mode"><i class="fa fa-infinity fa-fw"></i> One-Hit Obliterator Object</span>
    </section>
    <section class="search-result-drop" v-if="!dropAsName && hasNonDefaultDropTable()"><i class="fa fa-gem fa-fw"></i> {{drop()}}</section>
    <section class="search-result-equip" v-if="data.equip">
      <div v-if="obj.name == 'Npc_MinusFieldGhost_000'" style="display: inline">
        <div class="swords fa-fw fa" style="color: white">&#9876;</div> Possible:
        {{data.equip.map((x) => getName(x) + "✨").join(', ')}}
      </div>
      <div v-else>
        <i class="fa fa-shield-alt fa-fw"></i>
        {{data.equip.map((x) => getName(x)).join(', ')}}
      </div>
    </section>
    <section class="search-result-location" v-if="data.location">
      <i class="fas fa-fw fa-location-arrow" aria-hidden="true" style="color: honeydew"></i>
      {{data.location}}
    </section>
    <section class="search-result-scale" v-if="(data.name.startsWith('Enemy_') || data.name.startsWith('Weapon_') || data.name.startsWith('TBox_')) && data.scale === 1">
      <i class="fas fa-fw fa-chevron-up" style="color:yellow"></i>
      Can scale up
    </section>
    <section class="search-result-rankup" v-if="isActuallyRankedUp(data)">
      <i class="fas fa-fw fa-chevron-up"></i>
      Ranked up from {{name(false)}}
    </section>
    <section class="search-result-rankup" v-if="data.disable_rankup_for_hard_mode">
      <i class="fas fa-fw fa-ban" style="color:tomato"></i>
      No rankup in Master Mode
    </section>
    <section class="search-result-rankup" v-if="data.spawns_with_lotm" title="Spawns only when Lord of the Mountain is present">
      <i class="fas fa-fw fa-horse" style="text-shadow: lightblue 0px 0px 5px; color: lightblue;"></i>
      Lord of the Mountain
    </section>
    <section class="search-result-rankup" v-if="data.field_area == 28">
      <i class="fas fa-fw fa-ban" style="color:tomato"></i>
      No scaling on Eventide Island
    </section>
    <section class="search-result-bonus" v-if="data.sharp_weapon_judge_type > 0">
      <span v-if="data.sharp_weapon_judge_type == 1"><i class="far fa-star fa-fw" style="color: deepskyblue"></i> Minimum modifier tier: Blue (random)</span>
      <span v-if="data.sharp_weapon_judge_type == 2"><i class="fas fa-star fa-fw" style="color: deepskyblue"></i> Minimum modifier tier: Blue</span>
      <span v-if="data.sharp_weapon_judge_type == 3"><i class="fas fa-star fa-fw" style="color: #ffc700"></i> Minimum modifier tier: Yellow</span>
      <span v-if="data.sharp_weapon_judge_type == 4"><i class="far fa-star fa-fw" style="color: tomato"></i> No modifier</span>
    </section>
    <section class="search-result-yahaha" v-if="data.korok_type">
      <i class="fas fa-fw fa-leaf" style="color:lightgreen"></i>
      {{data.korok_id}} - {{ data.korok_type }}
    </section>
    <!--
    <section class="search-result-life" v-if="meta('life')">
      <i class="fas fa-fw fa-heart" style="color:white"></i> {{meta('life')}}
    </section>
    <section class="search-result-life" v-if="meta('attack')">
      <div class="swords fa-fw fa" style="color: white">&#9876;</div> {{meta('attack')}}
    </section>
    -->
  </div>
</template>
<style lang="less">
.search-result {
  border-radius: 3px;
  border: 1px solid #a2a2a27a;
  background: rgba(0, 0, 0, 0.35);
  padding: 10px 10px;
  margin-bottom: 10px;
  font-size: 85%;
  transition: background 0.2s, border 0.2s;
  overflow-wrap: break-word;

  &:not(.static) {
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid #c2c2c27a;
    }
  }

  &.active {
    background-color: #009bff5c !important;
    -webkit-box-shadow: inset 0 0 5px 2px #ffffffa1;
    box-shadow: inset 0 0 5px 2px #ffffffa1;
  }
}

.search-result-name {
  font-size: 110%;
  margin-bottom: 3px;
}

.swords {
    display: inline;
    font-weight: bold;
    font-size: 1.5em;
}

.search-result-life {
    display: inline-block;
    padding-right: 0.3em;
}

.checkmark-btn {
    position: relative;
    display: inline;
    text-shadow: none;
    background: none;
    border: 0px solid white;
    padding-top: 0px;
    padding-bottom: 0px;
    vertical-align: inherit;
    margin-top: -1em;
    float: right;
}

.checkmark-btn:focus, .checkmark-btn:active, .checkmark-btn:hover, .checkmark-btn:focus-visible {
    background: none !important;
    border: 0px solid white;
    box-shadow: none !important;
    -webkit-box-shadow: none !important;
}
</style>
<script src="./ObjectInfo.ts"></script>
