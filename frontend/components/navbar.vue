<template>
  <NDrawer v-model:show="isOpen" placement="left">
    <NDrawerContent title="The Di Luzios" closable>
      <div class="h-full flex flex-col justify-between">
        <NMenu v-model:value="selectedProfile" :options="menuOptions" />
        <div>
          <NDivider />
          <div class="text-center text-xs">
            commit
            <CustomLink :url="getLinkToCommit(commitHash)">
              {{ commitHash }}
            </CustomLink><br>
            built on
            <CustomLink :url="latestBuildsUrl">
              {{ buildDate.toLocaleDateString('de-DE') }}
            </CustomLink>
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
import { Airplane } from '@vicons/ionicons5';
import { RouterLink } from '~/.nuxt/vue-router';
import { useMenu } from '~/composables/useMenu';
import { upperCaseFirstLetter } from '~/utils/string';
import { profiles } from '~/server/profiles';
import { defaultProfile } from '~/constants/defaultProfile';
import { getLinkToCommit, latestBuildsUrl } from '~/utils/gitHubRepo';

// TODO change this to render the image of a profile
function renderIcon (icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = profiles.map((profile) => {
  const name = profile.person.name.first.toLowerCase();

  const menuOption: MenuOption = {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            path: `/${name}`,
          },
        },
        upperCaseFirstLetter(name),
      ),
    key: name,
    icon: renderIcon(Airplane),
  };

  return menuOption;
});

const route = useRoute();

function getCurrentProfile () {
  return (
    menuOptions
      .find(option => route.path.endsWith(option.key?.toString() ?? ''))
      ?.key?.toString() ?? defaultProfile
  );
}

const selectedProfile = ref<string | null>(getCurrentProfile());

const router = useRouter();
const { isOpen } = useMenu();

router.afterEach(() => {
  selectedProfile.value = getCurrentProfile();

  // Close navbar when any navigation occurs
  isOpen.value = false;
});

const runtimeConfig = useRuntimeConfig();

const { commitHash } = runtimeConfig.public;
const buildDate = new Date(runtimeConfig.public.buildDate);
</script>
