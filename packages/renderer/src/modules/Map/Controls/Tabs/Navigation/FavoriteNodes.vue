<script setup lang="ts">
import Navigator from '/@/services/Navigator'
</script>

<template>
  <div class="favorite-nodes">
    favorites
    <div v-for="node of Navigator.nodes.favorites.value" :key="node" class="item">
      <div>{{ node }}</div>
      <button @click="Navigator.inspector.node.value = node">select</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.favorite-nodes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item {
  display: flex;
  justify-content: space-between;
}

.actions {
  display: flex;
  gap: 4px;
}
</style>