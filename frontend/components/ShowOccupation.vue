<template>
  <div v-if="occupation">
    <p>Occupation: {{ occupation }} {{ getOccupationIcon(occupation) }}</p>
    <br>
    <div class="flex flex-col space-y-2 max-w-56">
      <p>Change Occupation:</p>
      <UInputMenu v-model="chosenOccupation" :options="availableOccupations" />
      <UButton :disabled="cantChangeOccupation" @click="changeOccupation">
        <template v-if="chosenOccupation === null">
          Apply
        </template>
        <template v-else>
          Apply change to {{ chosenOccupation }} {{
            getOccupationIcon(chosenOccupation) }}
        </template>
      </UButton>
    </div>
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
  {
    lazy: true,
    server: false,
  },
);

const availableOccupations =
  computed(() => Object.values(Occupation)
    .filter(availableOccupation => availableOccupation !== occupation.value));

const cantChangeOccupation =
  computed(() => chosenOccupation.value === null || chosenOccupation.value === occupation.value);

const chosenOccupation = ref<null | Occupation>(null);

async function changeOccupation () {
  await useFetch(
    basePath + 'occupations',
    {
      method: 'PUT',
      body: {
        occupation: chosenOccupation.value,
      },
      lazy: true,
      server: false,
    },
  );

  chosenOccupation.value = null;
  await refresh();
}

</script>
