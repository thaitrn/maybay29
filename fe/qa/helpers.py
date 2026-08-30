# QA helpers for Máy Bay 2/9 (Playwright, iPhone-like touch)
import asyncio, json
from importlib import util as _util

PW_PATH = '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'

async def load_pw():
    spec = _util.spec_from_file_location('pw', PW_PATH)
    mod = _util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

VIEWPORT = {'width': 390, 'height': 844}

async def launch(pw):
    browser = await pw.chromium.launch(headless=True)
    ctx = await browser.new_context(viewport=VIEWPORT, is_mobile=True, has_touch=True,
                                    device_scale_factor=2, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    page = await ctx.new_page()
    return browser, ctx, page

# game exposes globals on window: window.__game / scene. We probe via JS.
GETSTATE = """(() => {
  const g = window.game || window.__game || (window.Phaser && window.gameInstance);
  return g ? {has:true} : {has:false};
})()"""
