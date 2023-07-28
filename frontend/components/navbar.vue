<template>
  <NDrawer v-model:show="isOpen" placement="left">
    <NDrawerContent title="Menu" closable>
      <div class="h-full flex flex-col justify-between">
        <NMenu :options="menuOptions" />
        <div>
          <NDivider />
          <div class="text-center text-xs">
            commit
            <CustomLink :url="getLinkToCommit(commitHash)">
              {{ commitHash }}
            </CustomLink><br>
            built on
            {{ buildDate.toLocaleDateString('de-DE') }}
          </div>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import {
  MenuOption,
  NDrawer,
  NDrawerContent,
  NIcon,
  NMenu,
  NDivider,
} from 'naive-ui';
import { Hammer, Home } from '@vicons/ionicons5';
import { RouterLink } from '~/.nuxt/vue-router';
import { useMenu } from '~/composables/useMenu';
import { getLinkToCommit } from '~/utils/gitHubRepo';

// TODO change this to render the image of a profile
function renderIcon (icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions:Array<MenuOption> = [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            path: '/',
          },
        },
        'Home',
      ),
    key: 'resources',
    icon: renderIcon(Home),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            path: '/resources',
          },
        },
        'Resources',
      ),
    key: 'resources',
    icon: renderIcon(Hammer),
  }];

const router = useRouter();
const { isOpen } = useMenu();

router.afterEach(() => {
  // Close navbar when any navigation occurs
  isOpen.value = false;
});

const runtimeConfig = useRuntimeConfig();

const { commitHash } = runtimeConfig.public;
const buildDate = new Date(runtimeConfig.public.buildDate);
</script>
