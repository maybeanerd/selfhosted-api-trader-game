<template>
  <div>
    <template v-if="resources">
      <div v-if="resources.length === 0">
        No resources found.
      </div>
      <div v-for="resource in resources" v-else :key="resource.type">
        <p>Type: {{ resource.type }}</p>
        <p>Amount: {{ resource.amount }}</p>
        <p>Upgrade Level: {{ resource.upgradeLevel }}</p>
        <br>
      </div>
    </template>
    <div v-else>
      Loading resources...
    </div>
  </div>
</template>

<script setup lang="ts">
import { basePath } from '~/utils/api';

const { data: resources, refresh } = await useFetch<Array<{
  ownerId: string, type: string, amount: number, 'upgradeLevel': number
}>>(
  basePath + 'resources',
);

let stopInterval: NodeJS.Timeout;

onMounted(() => {
  // Refresh data every 2.5 seconds
  stopInterval = setInterval(refresh, 2500);
});

onUnmounted(() => {
  clearInterval(stopInterval);
});
</script>
