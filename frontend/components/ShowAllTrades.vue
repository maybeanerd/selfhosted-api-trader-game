<template>
  <div>
    <template v-if="trades">
      <div v-if="trades.length === 0">
        No trades found.
      </div>
      <template v-if="ownTrades && ownTrades.length > 0">
        <h1>Proposed Trades:</h1>
        <div v-for="trade in ownTrades" :key="trade.id" class="border-2 p-2">
          <p>Offered: {{ trade.offeredResources }}</p> <br>
          <p>Requested: {{ trade.requestedResources }}</p>
          <br>
          <UButton @click="takeBackTrade(trade.id)">
            Take Back
          </Ubutton>
        </div>
      </template>
      <template v-if="activeTrades && activeTrades.length > 0">
        <br>
        <h1>Received Trades:</h1>
        <div v-for="trade in activeTrades" :key="trade.id" class="border-2 p-2">
          <p>Offered: {{ trade.offeredResources }}</p> <br>
          <p>Requested: {{ trade.requestedResources }}</p>
          <br>
          <UButton @click="acceptTrade(trade.id)">
            Accept
          </Ubutton>
        </div>
      </template>
    </template>
    <div v-else>
      Loading trades...
    </div>
  </div>
</template>

<script setup lang="ts">
import { basePath } from '~/utils/api';

const { data: trades, refresh } = await useFetch<Array<{
  id: string,
  creatorId: string | null,
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
  basePath + 'trade',
);

const ownTrades = computed(() => trades.value?.filter(trade => trade.creatorId !== null));

const activeTrades = computed(() => trades.value?.filter(trade => trade.creatorId === null));

let stopInterval: NodeJS.Timeout;

onMounted(() => {
  // Refresh data every 2.5 seconds
  stopInterval = setInterval(refresh, 2500);
});

onUnmounted(() => {
  clearInterval(stopInterval);
});

async function acceptTrade (tradeId: string) {
  await fetch(basePath + 'trade', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: tradeId,
    }),
  });
  refresh();
}

async function takeBackTrade (tradeId: string) {
  await fetch(basePath + 'trade', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: tradeId,
    }),
  });
  refresh();
}

</script>
