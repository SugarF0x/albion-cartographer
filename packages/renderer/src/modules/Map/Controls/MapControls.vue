<script setup lang="ts">
import MainTab from '/@/modules/Map/Controls/Tabs/Main/MainTab.vue'
import NavigationTab from '/@/modules/Map/Controls/Tabs/Navigation/NavigationTab.vue'
import SettingsTab from '/@/modules/Map/Controls/Tabs/Settings/SettingsTab.vue'
import ControlsPanel from '/@/services/ControlsPanel'
import { type Component, ref } from 'vue'

enum Tab {
  MAIN = 'MAIN',
  NAVIGATION = 'NAVIGATION',
  SETTINGS = 'SETTINGS',
}

const tabToComponentMap: Record<Tab, Component> = {
  [Tab.MAIN]: MainTab,
  [Tab.NAVIGATION]: NavigationTab,
  [Tab.SETTINGS]: SettingsTab,
}

const activeTab = ref<Tab>(Tab.MAIN)
</script>

<template>
  <div v-show="ControlsPanel.isOpen.value" class="controls-container">
    <div class="tabs-container">
      <button
        v-for="tab in Tab"
        :key="tab"
        class="tab"
        :class="{ selected: activeTab === tab }"
        :disabled="activeTab === tab"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>
    <div class="tab-content">
      <keep-alive>
        <component :is="tabToComponentMap[activeTab]" />
      </keep-alive>
    </div>
  </div>

  <button v-if="!ControlsPanel.isOpen.value" id="open-controls" @click="ControlsPanel.isOpen.value = true">controls</button>
</template>

<style scoped lang="scss">
.controls-container {
  max-width: 50vh;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;

  background-color: #323B44;
  color: white;
  border-left: 4px solid #5d6876;
  box-sizing: border-box;

  :deep(#controls) {
    flex-grow: 1;
  }
}

.tabs-container {
  display: flex;
  padding: 8px 8px;
  justify-content: space-between;
  border-bottom: 4px solid #5d6876;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  text-transform: capitalize;
  cursor: pointer;

  &.selected {
    opacity: .5;
  }
}

.tab-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

#open-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}
</style>