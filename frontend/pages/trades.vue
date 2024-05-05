<template>
  <div>
    <h1>Propose a Trade:</h1>
    <br>
    <ProposeTrade />
    <br>
    <h1>Available Trades:</h1>
    <br>
    <ShowAllTrades />
  </div>
</template>

<script setup lang="ts">
import ShowAllTrades from '~/components/ShowAllTrades.vue';
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Trades';
</script>
