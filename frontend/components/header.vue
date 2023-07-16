<template>
  <div class="p-2 sticky top-0 bg-gray-900 border-b-[1px] border-gray-700 flex">
    <NButton quaternary round @click="toggleMenu">
      <template #icon>
        <NIcon size="26">
          <Menu />
        </NIcon>
      </template>
    </NButton>
    <div v-if="title" class="self-center mx-auto text-lg">
      <p>{{ title }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui';
import { Menu } from '@vicons/ionicons5';

import { useMenu } from '~/composables/useMenu';
import { useHeader } from '~/composables/useHeader';

const { isOpen } = useMenu();
const { title } = useHeader();

function toggleMenu () {
  isOpen.value = !isOpen.value;
}
</script>
