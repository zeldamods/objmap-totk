<template>
  <section>
    <details v-for="(list) in lists" :key="list.id" class="clDetails" @click="checkopen()">
      <summary>{{list.name}}: {{meta(list)}}
        <b-btn size="sm clButton" variant="link" @click="show(list)" title="Add to map">
          Add to map
        </b-btn>
      </summary>
      <details class="small" style="margin-left: 2em">
        <summary style="margin-left: -1em; font-size: 1.2em">Details</summary>
        <div class="clMeta">
          <div class="clMetaTable">
            <div class="clMetaRow">
              <div>Name</div>
              <input type="text" v-model="list.name"  class="clForm" @input="changeName(list)">
            </div>
            <div class="clMetaRow">
              <div>Query</div>
              <input type="search" v-model="list.query" class="clForm" >
            </div>
          </div>
          <div class="clButtonRow">
            <b-btn size="sm" variant="link" @click="changeQuery(list)">Update</b-btn>
            <b-btn size="sm" variant="link" @click="remove(list)">Remove</b-btn>
          </div>
        </div>
      </details>
      <ul class="clList" v-if="showItems">
        <AppMapChecklistItem class="small" v-for="(item, hash_id) in list.items" :key="hash_id" :item="item" />
      </ul>
    </details>
  </section>
</template>
<style lang="less">
  .clForm {
    background-color: rgba(255, 255,255,0.3);
    border: 1px solid rgba(255,255,255,0.2);
    line-height: 2;
    color: white;
    border-radius: 0.25rem;
    width: 100%;
    display: table-cell;
}
.clMetaTable {
    width: 100%;
    display: table;
}
.clMetaRow {
    display: table-row
}
.clMetaRow div {
    display: table-cell;
}
.clButtonRow {
    width: 100%;
    display: flex;
    flex: row nowrap;
    align-items: top;
    justify-content: center;
    gap: 0.5em;
}
.clMeta {
    padding: 0.2em;
}
.clList {
    padding-left: 1.5em;
    list-style: none;
}
.clButton {
    padding-top: 0px;
    padding-bottom: 0px;
    vertical-align: baseline;
}

</style>
<script src="./AppMapChecklists.ts"></script>
