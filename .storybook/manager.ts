import { addons } from 'storybook/manager-api'

addons.setConfig({
  contentsquare: {
    iWantToViolatePrivacyLawsAndSpyOnMyColleaguesWithoutTheirConsent: false,
    tagId: process.env.STORYBOOK_CONTENTSQUARE_TAG_ID,
  },
})
