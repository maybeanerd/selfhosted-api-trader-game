<template>
  <div>
    <template v-if="sortedResources">
      <div v-if="sortedResources.length === 0">
        No resources found.
      </div>
      <div v-for="resource in sortedResources" v-else :key="resource.type">
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

type Resource = {
  ownerId: string, type: string, amount: number, 'upgradeLevel': number
}

const { data: resources, refresh } = await useFetch<Array<Resource>>(
  basePath + 'resources',
  {
    lazy: true,
    server: false,
  },
);

function sortResourceAlphabetically (resourceA: Resource, resourceB: Resource) {
  if (resourceA.type < resourceB.type) {
    return -1;
  }
  if (resourceA.type > resourceB.type) {
    return 1;
  }
  return 0;
}

const sortedResources = computed(() => resources.value?.sort(sortResourceAlphabetically));

let stopInterval: NodeJS.Timeout;

onMounted(() => {
  // Refresh data every 2.5 seconds
  stopInterval = setInterval(refresh, 2500);
});

onUnmounted(() => {
  clearInterval(stopInterval);
});
</script>
