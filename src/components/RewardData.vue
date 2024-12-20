<template>
  <section>
    <hr>
    <h4 class="subsection-heading">Addison Rewards</h4>
    <div class="beedle-shop-limit-size">
      <div class="beedle-shop-table">
        <div v-for="idx in length()" :key="idx" class="table-row">
          <div class="cell">- {{name(idx)}}</div>
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
</style>
<script src="./RewardData.ts"></script>
