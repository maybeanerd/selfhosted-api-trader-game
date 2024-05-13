<template>
  <div v-if="occupation">
    <p>Occupation: {{ occupation }} {{ getOccupationIcon(occupation) }}</p>
  </div>
</template>

<script setup lang="ts">
import { basePath } from '~/utils/api';

enum Occupation {
  MINER = 'miner',
  LOGGER = 'logger',
  HUNTER = 'hunter',
}

const occupationIcon = {
  [Occupation.MINER]: '⛏️',
  [Occupation.LOGGER]: '🪵',
  [Occupation.HUNTER]: '🏹',
};

function getOccupationIcon (occupation: Occupation) {
  return occupationIcon[occupation];
}

const { data: occupation, refresh } = await useFetch<Occupation>(
  basePath + 'occupations',
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
