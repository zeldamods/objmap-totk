<template>
  <div>
    <div v-if="staticData.history.length" style="right: 40px" class="leaflet-sidebar-close" @click="goBack()" v-b-tooltip.hover title="Go back to previous object"><i class="fa fa-arrow-left"></i></div>

    <h2 class="location-sub" v-if="getLocationSub()">{{getLocationSub()}}</h2>
    <ObjectInfo :obj="minObj" :key="minObj.objid" className="obj-main-info" withPermalink />

    <section v-if="obj" class="mt-2">
      <section v-if="isActuallyRankedUp(obj)">Actor: {{getRankedUpActorNameForObj(obj)}} (ranked up)</section>
      <section v-if="!isActuallyRankedUp(obj)">Actor: {{obj.name}}</section>
      <section>Position: {{obj.data.Translate[0].toFixed(2)}}, {{obj.data.Translate[1].toFixed(2)}}, {{(-obj.data.Translate[2]).toFixed(2)}}</section>
      <section v-if="obj.data.Scale != null">Scale: {{arrayOrNumToStr(obj.data.Scale, 2)}}</section>
      <section v-if="obj.data.Rotate != null">Rotate: {{arrayOrNumToStr(obj.data.Rotate, 5)}}</section>
      <section v-if="obj.data.UniqueName">Unique name: {{obj.data.UniqueName}}</section>

      <p class="my-1" v-if="isPossibleConditionalSpawn()" style="color: orange"><i class="fa fa-exclamation-circle"></i> This object might be a conditional spawn, or it might have custom logic.</p>

      <p class="my-1" v-if="obj.data.Presence" style="color: orange"><i class="fa fa-exclamation-circle"></i> This object only spawns if the flag <code>{{obj.data.Presence.FlagName}}</code> is {{obj.data.Presence.IsNegation ? "not" : ""}} set.</p>

      <p class="my-1" v-if="isAreaReprPossiblyWrong()"><i class="fa fa-exclamation-circle"></i> Area representation may be inaccurate.</p>

      <section class="mt-2" v-show="areaMarkers.length || staticData.persistentAreaMarkers.length">
        <b-btn v-show="areaMarkers.length" size="sm" block variant="dark" @click="keepAreaMarkersAlive()">Keep area representation loaded</b-btn>
        <b-btn v-show="staticData.persistentAreaMarkers.length" size="sm" block variant="dark" @click="forgetPersistentAreaMarkers()">Hide area representation</b-btn>
      </section>
      <section class="mt-2" v-show="minObj.korok_type && (this.korokMarkers.length || staticData.persistentKorokMarkers.length)">
        <b-btn v-show="this.korokMarkers.length" size="sm" block variant="dark" @click="keepKorokMarkersAlive()">Keep Korok markers loaded</b-btn>
        <b-btn v-show="staticData.persistentKorokMarkers.length" size="sm" block variant="dark" @click="forgetPersistentKorokMarkers()">Hide Korok markers</b-btn>
      </section>
      <section class="mt-2" v-show="this.railMarkers.length || staticData.persistentRailMarkers.length">
        <b-btn v-show="this.railMarkers.length" size="sm" block variant="dark" @click="keepRailMarkersAlive()">Keep Rails loaded</b-btn>
        <b-btn v-show="staticData.persistentRailMarkers.length" size="sm" block variant="dark" @click="forgetPersistentRailMarkers()">Hide Rails</b-btn>
      </section>

      <section class="obj-actor-specific-info">
        <!-- EventTag, SignalFlowchart -->
        <div class="mt-2" v-if="(obj.name == 'EventTag' || obj.name == 'SignalFlowchart') && obj.data['!Parameters']">
          <p v-if="obj.name == 'EventTag'">Activates event <code>{{obj.data['!Parameters'].EventFlowName}}&lt;{{obj.data['!Parameters'].EventFlowEntryName}}&gt;</code> when signalled.</p>
          <p v-if="obj.name == 'SignalFlowchart'">Runs <code>{{obj.data['!Parameters'].EventFlowName}}&lt;{{obj.data['!Parameters'].EventFlowEntryName}}&gt;</code> in a loop and emits a basic signal when a signal is sent from the event flow.</p>

          <a target="_blank" :href="`https://eventviewer.zeldamods.org/viewer.html?data=/d/${obj.data['!Parameters'].EventFlowName}.json&params=1&entry=${obj.data['!Parameters'].EventFlowEntryName}`" class="btn btn-block btn-sm btn-info"><i class="fa fa-external-link-alt"></i> View in EventViewer</a>
        </div>
      </section>

      <section v-if="shopDataExists()">
        <ShopData :data="shopData[this.getLocationSub()]" />
      </section>

      <section v-if="obj.data.Presence">
        <hr>
        <h4 class="subsection-heading">Presence params</h4>
        <pre class="obj-params">{{JSON.stringify(obj.data.Presence, undefined, 2)}}</pre>
      </section>

      <section v-if="obj.data.Dynamic">
        <hr>
        <h4 class="subsection-heading">Dynamic params</h4>
        <pre class="obj-params">{{JSON.stringify(obj.data.Dynamic, undefined, 2)}}</pre>
      </section>

      <section v-if="obj.data.Phive">
        <hr>
        <h4 class="subsection-heading">Physics params</h4>
        <pre class="obj-params">{{JSON.stringify(obj.data.Phive, undefined, 2)}}</pre>
      </section>

      <section v-if="dropTableExists()" class="droptable">
        <hr>
        <h4 class="subsection-heading">Drop table: {{this.dropTables.DropTableName || 'Default'}}</h4>
        <div v-for="(group, igroup) in this.dropTables.items" :key="igroup">
          <div v-if="group.DropTableElement.length" class="droptable_content">
            <div class="droptable_group">{{getDropTableGroupCount(group)}}</div>
            <table>
              <tr v-for="(item, kitem) in [...group.DropTableElement].sort((a,b) => b.DropProbability - a.DropProbability)" :key="kitem" class="droptable_item">
                <td class="drop-probability">{{item.DropProbability}}%</td>
                <td>
                  <span v-if="item.IsProxySetting">{{item.ProxyType}} - {{item.WeaponType}}</span>
                  <span v-else>{{getName(item.DropActorName.split("/").pop().split(".")[0])}}</span>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </section>

    </section>

    <section v-if="isSearchResult()">
      <br>
      <b-btn size="sm" block @click="emitBackToSearch()"><i class="fa fa-chevron-circle-left"></i> Back to search</b-btn>
    </section>

    <section v-if="railsWithMarkers.length">
      <hr>
      <h4 class="subsection-heading">Rails</h4>
      <div class="search-results">
        <div class="search-result"
          v-for="(rail, idx) in rails"
          :key="rail.Hash"
          @click="onRailClicked(idx)"
          :class="{'active': idx === selectedRailIdx}"
        >
          <section class="search-result-name">{{getRailUiName(rail)}}</section>
          <section v-if="rail.Gyaml && rail.Gyaml !== rail.Name"><i class="fas fa-hashtag fa-fw"></i> Gyaml: {{rail.Gyaml}}</section>
          <section v-if="rail.Name"><i class="fas fa-hashtag fa-fw"></i> Name: {{rail.Name}}</section>
          <section v-if="rail.Hash"><i class="fas fa-hashtag fa-fw"></i> Hash: {{formatObjId(rail.Hash)}}</section>
          <section v-if="rail.Dynamic && rail.Dynamic.IsEnabledGameDataFlagName"><i class="fas fa-lightbulb fa-fw"></i> Enabled if <code>{{rail.Dynamic.IsEnabledGameDataFlagName}}</code></section>
        </div>
      </div>
    </section>

    <section v-for="group in aiGroups" :key="group.hash_id">
      <hr>
      <h4 class="subsection-heading">AI group {{formatObjId(group.hash_id)}}</h4>
      <p v-if="group.data.Logic">Logic: <code>{{group.data.Logic}}</code></p>
      <p v-if="group.data.Meta">Meta: <code>{{group.data.Meta}}</code></p>
      <p v-if="group.data.Blackboard">Blackboards: {{group.data.Blackboards}}</p>
      <div class="search-results">
        <div class="search-result"
          v-for="ref in group.data.References"
          :key="ref.Path + ref.Reference"
          @click="onAiGroupReferenceClicked(group, ref)"
        >
          <section class="search-result-name">{{getAiGroupReferenceName(group, ref)}}</section>
          <section v-if="ref.Id"><i class="fas fa-hashtag fa-fw"></i> ID: {{ref.Id}}</section>
          <section v-if="ref.Reference"><i class="fas fa-hashtag fa-fw"></i> Ref: {{formatObjId(ref.Reference)}}</section>
          <section v-if="ref.InstanceName"><i class="fas fa-hashtag fa-fw"></i> Instance: {{ref.InstanceName}}</section>
          <section v-if="ref.Logic"><i class="fas fa-lightbulb fa-fw"></i> Logic: {{ref.Logic}}</section>
        </div>
      </div>
    </section>

    <section v-show="genGroup.length">
      <hr>
      <details>
        <summary>
          <h4 class="subsection-heading">Generation group</h4>
        </summary>
        <div class="search-results">
          <ObjectInfo v-for="otherObj in genGroup" :key="otherObj.objid" :obj="otherObj" :isStatic="false" @click.native="jumpToObj(otherObj)" />
        </div>
      </details>
    </section>
  </div>
</template>
<style lang="less">
.obj-main-info {
  font-size: 90%;
  .search-result-name {
    display: none;
  }
}

.obj-params {
  color: #dcdcdc;
}

.stump {
    width: 30px;
    height: 30px;
    content: "";
    border: 4px solid #733900;
    border-radius: 50%;
    padding: 15%;
    background: #DAA96A;
    position: relative;
}
.big-leaf {
  color: #C95A2A;
  font-size: 1.2em;
  top: 50%;
  left: 50%;
  transform: translate(-60%, -50%) rotate(-45deg) ;
  position: absolute;
}

.droptable {
  font-size: 0.9em;
}

.droptable_group {
  font-weight: bold;
}

.drop-probability {
  display: inline-block;
  width: 5em;
  text-align: right;
  margin-right: 1em;
}
</style>
<script src="./AppMapDetailsObj.ts"></script>
