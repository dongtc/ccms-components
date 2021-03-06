/**
 * Created with MenusCtrl.js
 * @Description:
 * @Author: maxsmu
 * @Date: 2016-02-29 6:52 PM
 */
import {Inject, EventBus} from 'angular-es-utils';
import {$Menus} from './MenuService';
@Inject('$menus', '$timeout', '$state', '$rootScope', '$document', '$scope')
export default class MenusCtrl {

	$onInit() {
		// -获取menus数据
		this.getMenus();
	}

	/**
	 * 单击一级菜单
	 * @param menu
	 */
	oneListClick(menu, $event) {
		$event.preventDefault();
		menu.toggle = !menu.toggle;
	};

	/**
	 * 二级菜单容器样式
	 * @param menu
	 * @returns {*}
	 */
	menuStyle(menu) {
		// this._$timeout(() => {
		menu.toggle = typeof menu.toggle === 'undefined'
			? this.$state && this.$state.includes(menu.state)
			: menu.toggle;
		return menu.toggle ? {display: 'block'} : {};
		// }, 0);
	};

	/**
	 * 获取当前选中的平台以及店铺
	 * @param list
	 * @private
	 */
	_getActiveShop(list) {
		// -点击非有效区域自动关闭shopSelect
		this._$document.bind('click', event => {
			const target = event.target,
				targetName = target.className,
				shopClosest = target.closest('.shop-choose-wrapper'),
				menusClosest = target.closest('.menu-container');
			// -!targetName.includes('shop-search-clear') 清除点击清空收起店铺选择器的bug
			if (shopClosest === null && menusClosest === null && !targetName.includes('shop-search-clear')) {
				if (this.shopShow) {
					this.shopShow = false;
					this._$scope.$digest();
				}
			}
		});
		this.active = {};

		if (Array.isArray(list)) {

			// -查询所在平台
			const plat = list.find(plat => {
					return plat.active;
				}),
			// -查询在平台中选中的店铺
				shop = plat && Array.isArray(plat.child) ? plat.child.find(shop => {
					return shop.active;
				}) : {};

			this.active = {
				plat,
				shop
			};

			// -更新服务中的当前选择店铺数据
			this._$menus.shopActive = $Menus._active(plat, shop);

			// -第一次广播时间通知调用者当前选择的店铺
			this._$timeout(() => {
				this._$rootScope.$broadcast('shop:change', this._$menus.shopActive);
				EventBus.dispatch('shop:change', this._$menus.shopActive);
			}, 0);
		}
	}

	/**
	 * 展开回调函数
	 */
	unfoldClick() {
		this.unfold = !this.unfold;

		// -判断是否为function 是则执行函数   否则不作为
		(typeof this.onUnfold === 'function')
			? this.onUnfold(this.unfold)
			: null;
	};

	/**
	 * 获取menus 数据源
	 */
	getMenus() {

		// -菜单列表
		const menus = $Menus.getMenus(this.menuSource);

		// -如果为Resource,则执行查询操作,否则返回原数据
		if (menus.isResource) {

			menus.resource.$promise
				.then(res => {
					this.menuList = res || [];
					this.activeMenus(this.menuList);
				});
		} else {
			this.menuList = Array.isArray(menus.resource) ? menus.resource : [];
			this.activeMenus(this.menuList);
		}

		// -获取店铺信息
		this.getShops();
	}

	/**
	 * 获取shops数据源
	 */
	getShops() {
		// -店铺列表
		const shops = $Menus.getShops(this.shopSource);

		if (shops.isResource) {

			shops.resource
				.$promise
				.then(res => {
					this.shopsInfo = res || [];
					this._getActiveShop(this.shopsInfo);
				});

		} else {
			const resourceIsArray = Array.isArray(shops.resource);
			this.shopsInfo = resourceIsArray ? shops.resource : [];
			resourceIsArray && this._getActiveShop(this.shopsInfo);
		}
	}

	/**
	 * 当前选中的菜单
	 * @param menuList
	 */
	activeMenus(menuList = []) {
		this._$timeout(() => {
			const active = menuList.find(menu => {
				return this._$state.includes(menu.state);
			});
			active ? active.toggleNode = true : null;
			if (active) {
				const child = active.children;
				Array.isArray(child) && child.length > 0 ? this.activeMenus(child) : null;
			}
		}, 0);
	}

	/**
	 * 店铺信息
	 */
	shopsClick() {
		this.shopShow = !this.shopShow;
		if (!this.shopShow) {

			// -通知店铺列表收起
			EventBus.dispatch('shop:list-switch', this.shopShow);
		}
	}
}
