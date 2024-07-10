<script lang="ts" setup>
import NodeMap from './NodeMap.vue'
</script>

<template>
  <NodeMap />
</template>

<style lang="scss">
$c: #323b44;
$b: rgba(255,255,255,.2);
$t: rgba(255,255,255,.1);
$n: transparent;

html, body {
  padding: 0;
  margin: 0;
  background-color: $c;
  height: 100vh;
  width: 100vw;
}

html, body, #app {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

html {
  background-image: linear-gradient(to bottom, $c 0%, darken($c, 15%) 100%);
}

body {
  color: white;

  background-image:
    linear-gradient(0deg,
      $n 0%, $n 9px,
      $b 9px, $b 10px, $n 10px, $n 19px,
      $t 19px, $t 20px, $n 20px, $n 29px,
      $t 29px, $t 30px, $n 30px, $n 39px,
      $t 39px, $t 40px, $n 40px, $n 49px,
      $t 49px, $t 50px),
    linear-gradient(-90deg,
      $n 0%, $n 9px,
      $b 9px, $b 10px, $n 10px, $n 19px,
      $t 19px, $t 20px, $n 20px, $n 29px,
      $t 29px, $t 30px, $n 30px, $n 39px,
      $t 39px, $t 40px, $n 40px, $n 49px,
      $t 49px, $t 50px);
  background-size: 50px 50px;
}
</style>
