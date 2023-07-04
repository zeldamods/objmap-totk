<template>
  <li class="small" >
    <input type="checkbox" :checked="item.marked" @change="itemChange(item)">
    <b-btn class="small" size="sm"
           style="padding-top:0; padding-bottom: 0; font-size: inherit; padding-left: 2px;"
           variant="link" @click='searchOnValue(`"${item.name}"`)'>{{item.ui_name}}</b-btn>
    <b-btn class="small" size="sm"
           style="padding-top:0; padding-bottom: 0; font-size: inherit; padding-left: 2px;"
           variant="link" @click='searchOnValue(`map:"${item.map_name}"`)'>{{item.map_name}}</b-btn>
  </li>
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
<script src="./AppMapChecklistItem.ts"></script>
