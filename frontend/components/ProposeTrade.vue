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

  await fetch('http://localhost:8080/v1/trade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trade),
  });

  requestedResources.value = {};
  offeredResources.value = {};
}

</script>
