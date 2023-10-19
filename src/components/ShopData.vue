<template>
  <section>
    <hr>
    <h4 class="subsection-heading">Shop Data</h4>
    <div class="beedle-shop-limit-size">
      <div class="beedle-shop-table">
        <div v-for="idx in length()" :key="idx" class="table-row">
          <div class="cell">{{name(idx)}}</div>
          <div class="cell">{{num(idx)}}</div>
          <div class="cell">
            <img v-if="currency(idx) == 'Rupee'" width="15" src="rupee.svg" title="Rupee">
            <img v-else-if="currency(idx) == 'MinusRupee'" width="15" src="poe.png" title="Poe">
            <img v-else-if="currency(idx) == 'Zonanium'" width="28" src="Zonaite.png" title="Zonaite">
            <img v-else-if="currency(idx) == 'BigZonanium'" width="28" src="LargeZonaite.png" title="Large Zonaite">
          </div>
          <div class="cell">{{price(idx)}}</div>
          <div class="cell">
            <div v-if="has_condition(idx)" style="display: inline">
              <div v-if="condition_type(idx) == 'GameData'" :title="`${game_data(idx)}`" ><i class="fas fa-info-circle gamedata"></i></div>
              <div v-if="condition_type(idx) == 'GetFlag'" title="Must have obtained item previously" ><i class="fas fa-info-circle getflag"></i></div>
              <div v-else-if="condition_type(idx) == 'Rainy'" :title="`${weather_text(idx)}`"><i class="fas fa-cloud-rain rainy"></i></div>
              <div v-else-if="condition_type(idx) == 'Sunny'" :title="`${weather_text(idx)}`"><i class="fas fa-sun sunny"></i></div>
              <div v-else-if="condition_type(idx) == 'Stormy'" :title="`${weather_text(idx)}`"><i class="fas fa-bolt stormy"></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<style>
  .beedle-shop-limit-size {
      max-height: 15em;
      overflow: scroll;
      padding-right:1em;
  }
  .beedle-shop-table {
      color: white;
      display: table;
      width: 100%;
  }
  .beedle-shop-table .table-row {
      display: table-row;
  }
  .beedle-shop-table .cell {
      display: table-cell;
  }
  .sunny {
      color: gold;
  }
  .rainy {
      color: white;
  }
  .stormy {
      color: yellow;
  }
  .gamedata {
      color: tomato;
  }
  .getflag {
      color: rgba(255,255,255,0.5);
  }
</style>
<script src="./ShopData.ts"></script>
