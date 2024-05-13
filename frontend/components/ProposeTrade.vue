<template>
  <div>
    <h1>Requested Resources:</h1>
    <UInputMenu v-model="requestedResources.type" :options="resourceOptions" />
    <UInput v-model="requestedResources.amount" type="number" />
    <br>
    <h1>Offered Resources:</h1>
    <UInputMenu v-model="offeredResources.type" :options="resourceOptions" />
    <UInput v-model="offeredResources.amount" type="number" />
    <br>
    <UButton class="p-2" @click="submitTrade">
      Submit Trade
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { basePath } from '~/utils/api';

const resourceOptions = [
  'wood',
  'stone',
];

const requestedResources = ref<{
  type?: string,
  amount?: number,
}>({});

const offeredResources = ref<{
  type?: string,
  amount?: number,
}>({});

async function submitTrade () {
  const trade = {
    requestedResources: [requestedResources.value],
    offeredResources: [offeredResources.value],
  };

  await useFetch(basePath + 'trades', {
    method: 'POST',
    body: trade,
  });

  requestedResources.value = {};
  offeredResources.value = {};
}

</script>
