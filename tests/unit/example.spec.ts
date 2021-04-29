import { shallowMount } from '@vue/test-utils';
import HelloWorld from '@/components/HelloWorld.vue';

import { chromium } from 'playwright';

let browser: any;

beforeAll(async () => {
  browser = await chromium.launch();
});

let page: any;

beforeEach(async () => {
  page = await browser.newPage();
});

describe('HelloWorld.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message';
    const wrapper = shallowMount(HelloWorld, {
      props: { msg },
    });
    expect(wrapper.text()).toMatch(msg);
  });

  it('should go to a webpage', async () => {
    await page.goto(`127.0.0.1:${process.env.WEBPACK_DEVELOPMENT_SERVER_PORT}`);
    expect(await page.title()).toBe(process.env.npm_package_name);
  });
});

afterEach(async () => {
  await page.close();
});

afterAll(async () => {
  await browser.close();
});
