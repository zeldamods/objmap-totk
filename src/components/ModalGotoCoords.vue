<template>
  <b-modal ref="modalGoto" modal-class="modalpane" title="Enter target coordinates." @shown="() => this.$refs.formGotoX.focus()">
    <b-form inline class="justify-content-center" @submit.prevent="onSubmit">
      <b-input class="mb-2 mr-sm-2 mb-sm-0" placeholder="X coordinate" v-model="x" ref="formGotoX" required @paste.native="onPaste"/>
      <b-input class="mb-2 mr-sm-2 mb-sm-0" placeholder="Z coordinate" v-model="z" required/>
      <b-button type="submit" variant="primary">Go</b-button>
    </b-form>
    <div class="text-center mt-3">
      <p>Please use the actual coordinates, not the in-game coordinates.</p>
      <p><code>(x, y, z)</code> in-game is actually <code>(x, -z, y - dy)</code> with dy ~= 106</p>
    </div>
  </b-modal>
</template>
<style lang="less" src="./ModalPane.less"></style>
<script src="./ModalGotoCoords.ts"></script>
