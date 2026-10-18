<template>
  <div class="modal fade modalpane" aria-labelledby="modal-goto-title" area-hidden="true" tabindex="-1">
    <div class="modal-dialog modal-md">
      <div class="model-content">
        <header class="modal-header">
          <h5 class="modal-title" id="modal-goto-title">Enter target coordinates.</h5>
          <button type="button" aria-label="Close" class="btn-close" @click="hide" data-bs-theme="dark"></button>
        </header>
        <div class="modal-body">
          <form class="row row-cols-sm-auto g-2 align-items-center justify-content-center" @submit.prevent="onSubmit">
            <div class="col-12"><input type="text" class="form-control mb2 mr-sm-2 mb-sm-0" placeholder="X coordinate" v-model="x" ref="formGotoX" required @paste="onPaste"></div>
            <div class="col-12"><input type="text" class="form-control mb2 mr-sm-2 mb-sm-0" placeholder="Z coordinate" v-model="z" required></div>
            <div class="col-12"><button type="submit" class="btn btn-primary">Go</button></div>
          </form>
          <div class="text-center mt-3">
            <p>Please use the actual coordinates not the in-game coordinates.</p>
            <p><code>(x, y, z)</code> in-game is actaully <code>(x, -z, y- dy)</code> with dy ~= 106</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="less" src="./ModalPane.less"></style>
<script src="./ModalGotoCoords.ts"></script>
