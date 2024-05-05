<template>
  <div>
    <template v-if="trades">
      <div v-if="trades.length === 0">
        No trades found.
      </div>
      <div v-for="trade in ownTrades" :key="trade.id" class="border-2 p-2">
        <p>Offered: {{ trade.offeredResources }}</p> <br>
        <p>Requested: {{ trade.requestedResources }}</p>
        <br>
        <UButton>
          Accept
        </Ubutton>
      </div>
      <div v-for="trade in activeTrades" :key="trade.id" class="border-2 p-2">
        <p>Offered: {{ trade.offeredResources }}</p> <br>
        <p>Requested: {{ trade.requestedResources }}</p>
        <br>
        <UButton>
          Take Back
        </Ubutton>
      </div>
    </template>
    <div v-else>
      Loading trades...
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: trades, refresh } = await useFetch<Array<{
  id: string,
  creatorId?: string,
  requestedResources: Array<
    {
      type: string,
      amount: number,
    }
  >
  offeredResources: Array<
    {
      type: string,
      amount: number,
    }
  >
}>>(
  'http://localhost:8080/v1/trade',
);

const ownTrades = computed(() => trades.value?.filter(trade => trade.creatorId !== undefined));

const activeTrades = computed(() => trades.value?.filter(trade => trade.creatorId === undefined));

let stopInterval: NodeJS.Timeout;

onMounted(() => {
  // Refresh data every 2.5 seconds
  stopInterval = setInterval(refresh, 2500);
});

onUnmounted(() => {
  clearInterval(stopInterval);
});

</script>
