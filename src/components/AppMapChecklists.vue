<template>
  <section class="tall">
    <h1 class="leaflet-sidebar-header" style="width: 100%">Checklists</h1>

    <section class="appmapchecklist" v-if="activeList === -1" >
      <div class="clButtonRow">
        <b-btn size="clButton" variant="link" @click="create()">New List</b-btn>
        <b-btn size="clButton" variant="link" @click="reset()">Reset</b-btn>
      </div>
      <div class="clListWrap">
        <div v-for="(list) in lists" :key="list.id" class="clListBox"
             @click="checkopen(list)">
          <div class="clListName">{{list.name}}</div>
          <div>{{meta(list)}}</div>
          <div>
            <b-btn size="sm clButton" variant="link" style="padding: 0"
                   @click.stop.prevent="show(list)" title="Add items to map">
              Add items to map
            </b-btn>
          </div>
          <b-btn size="sm clButton clRemove" variant="link" 
                 @click.prevent.stop="remove(list)" title="Remove checklist">
            <i class="fas fa-times"></i>
          </b-btn>
        </div>
      </div>
    </section>
    <div v-else class="clDetails">
      <section class="header">
        <b-btn size="sm" class="back" variant="link" @click="back()"
               title="Back to Checklists">
          <i class="fa fa-arrow-left"></i>
        </b-btn>
        <section>
          <div class="clListName">{{xlist.name}}</div>
          <div>{{meta(xlist)}}</div>
        </section>
        <div class="clMeta">
          <div class="clMetaTable">
            <div class="clMetaRow">
              <div>Name</div>
              <input type="text" v-model="xlist.name"  class="clForm" @input="changeName(xlist)">
            </div>
            <div class="clMetaRow">
              <div>Query</div>
              <input type="search" v-model="xlist.query" class="clForm" >
            </div>
          </div>
        </div>
      </section>
      <section class="clButtonRow">
        <b-btn size="sm" variant="link" @click="changeQuery(xlist)">Update</b-btn>
        <b-btn size="sm" variant="link" @click="remove(xlist)">Remove</b-btn>
      </section>

      <ul class="clList">
        <DynamicScroller
          class="scroller"
          :items="Object.values(xlist.items)"
          :min-item-size="26"
          key-field="hash_id"
          >
          <!-- <AppMapChecklistItem class="small" v-for="(item, hash_id) in list.items" :key="hash_id" :item="item" /> -->
          <template v-slot="{ item, index, active }">
            <DynamicScrollerItem
              :item="item"
              :active="active"
              :data-index="index"
              >
              <AppMapChecklistItem
                class="small"
                :key="item.hash_id"
                :item="item"
                :bus="bus"/>
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
      </ul>
    </div>
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
.maxGap {
    justify-content: space-between;
}
.clMeta {
    padding: 0.2em;
}
.clList {
    padding-left: 1.5em;
    list-style: none;
    height: 100%;
    overflow-y: auto;
}
.clButton {
    padding-top: 0px;
    padding-bottom: 0px;
    vertical-align: baseline;
}
.appmapchecklist {
    position: relative;
    flex-grow: 3;
    display: flex;
    align-items: flex-start;
    border: 0px solid fuchsia;
    width: 100%;
    overflow: auto;
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    overflow: auto;
}
.vue-recycle-scroller {
    max-height: 100%;
}
.clListBox {
    display: flex;
    flex-flow: column nowrap;
    width: 100%;
    border-radius: 3px;
    border: 1px solid #a2a2a27a;
    background: rgba(0,0,0,0.35);
    padding: 10px 10px;
    margin-bottom: 10px;
    font-size: 85%;
    transition: background 0.2s, border 0.2s;
    overflow-wrap: break-word;
    position: relative;
    
    &:not(.static) {
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid #c2c2c27a;
    }

    &.active {
        background-color: #009bff5c !important;
        -webkit-box-shadow: inset 0 0 5px 2px #ffffffa1;
        box-shadow: inset 0 0 5px 2px #ffffffa1;
    }
  }
}
.clListWrap {
    display: flex;
    height: 100%;
    width: 100%;
    overflow-y: auto;
    flex-grow: 3;
    flex-flow: column nowrap;
    border: 0px solid lime;
    position: relative;
}
.clListName {
    font-size: 1.2em;
    font-weight: bold;
}
.clDetails {
    width: 100%;
    padding: 5px;
    border: 0px solid fuchsia;
    overflow-y: auto;
    display: flex;
    flex-flow: column nowrap;
}
.tall {
    width: 100%;
    display: flex;
    flex-flow: column nowrap;
    overflow-y: auto;
    position: relative;
}
.back {
    position: absolute;
    top: 0;
    right:0;
    border: 0px solid fuchsia;
}
.clRemove {
    position: absolute;
    top: 0;
    right: 0;
    padding: 10px;
    border: 0px solid fuchsia;
}
</style>
<script src="./AppMapChecklists.ts"></script>
