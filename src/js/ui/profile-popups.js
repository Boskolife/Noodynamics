/**
 * Profile / membership and My Donations popup flows.
 *
 * MY DONATIONS FLOW (entry: header dropdown "My donations" -> donations-popup):
 * - Donations (hub): "Change monthly donation amount" -> change-monthly-donation-popup;
 *   "Set up monthly donation" -> monthly-donation-setup-popup;
 *   "Cancel" (on active monthly) -> cancel-monthly-donation-confirm (.popup).
 * - Change monthly donation: "Back" -> donations; form submit (valid) -> monthly-donation-updated (.popup).
 * - Monthly donation updated: "Done" -> donations.
 * - Monthly donation setup: "Back" -> donations; form submit (valid) -> donations.
 * - Cancel monthly donation confirm: "Keep monthly donation" -> donations; "Cancel monthly donation" -> monthly-donation-canceled (.popup).
 * - Monthly donation canceled: "Done" -> close and open donations (return to hub).
 *
 * MEMBERSHIP FLOW (entry: header dropdown "My membership" -> membership-popup):
 * - Membership: "Change membership level" -> change-membership-popup; "Cancel membership" -> cancel-membership-confirm (.popup).
 * - Change-membership: "Select" on a level -> change-membership-details; "Back" -> membership-popup; "Continue" -> details (if level selected).
 * - Change-membership-details: "Confirm" -> membership-level-updated (.popup); "Back" -> change-membership-popup.
 * - Cancel-membership-confirm: "Keep" -> close; "Cancel my membership" -> membership-canceled (.popup).
 * - Membership-canceled / membership-level-updated: "Done" -> close.
 */

import { closePopup } from './auth-popup.js';
import { initModalManager, openModalById, closeModalById } from './modal-manager.js';
import {
  validateFormWithRules,
  clearAllFormErrors,
  clearFieldErrorByTarget,
  setRadioGroupValid,
  setValid,
  clearErrorById,
} from '../forms/validation.js';

const PROFILE_POPUP_SELECTOR = '.profile-popup';
const PROFILE_DROPDOWN_ID = 'header-profile-dropdown';
const PROFILE_BTN_SELECTOR = '.js-header-profile';

const IDS = {
  membership: 'membership-popup-backdrop',
  donations: 'donations-popup-backdrop',
  changeMonthlyDonation: 'change-monthly-donation-popup-backdrop',
  monthlyDonationSetup: 'monthly-donation-setup-popup-backdrop',
  accountDetails: 'account-details-popup-backdrop',
  accountChangePassword: 'account-change-password-popup-backdrop',
  changeMembership: 'change-membership-popup-backdrop',
  changeMembershipDetails: 'change-membership-details-popup-backdrop',
  cancelConfirm: 'cancel-membership-confirm-popup-backdrop',
  membershipCanceled: 'membership-canceled-popup-backdrop',
  levelUpdated: 'membership-level-updated-popup-backdrop',
  cancelMonthlyDonationConfirm: 'cancel-monthly-donation-confirm-popup-backdrop',
  monthlyDonationCanceled: 'monthly-donation-canceled-popup-backdrop',
  monthlyDonationUpdated: 'monthly-donation-updated-popup-backdrop',
};

function openProfilePopup(id) {
  openModalById(id);
}

function openSharedPopup(id) {
  openModalById(id);
}

function closeProfilePopup(backdrop) {
  if (!backdrop?.id) return;
  closeModalById(backdrop.id);
}

function closeProfileDropdown() {
  const dropdown = document.getElementById(PROFILE_DROPDOWN_ID);
  const profileBtn = document.querySelector(PROFILE_BTN_SELECTOR);
  if (dropdown) dropdown.hidden = true;
  if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
}

export function initProfilePopups() {
  initModalManager();
  const membershipPopup = document.getElementById(IDS.membership);
  const changeMembershipPopup = document.getElementById(IDS.changeMembership);
  const changeDetailsPopup = document.getElementById(IDS.changeMembershipDetails);
  // Close logic (overlay/close/Escape) is handled by modal-manager.

  const openMembershipBtn = document.querySelector('.js-open-membership-popup');
  if (openMembershipBtn) {
    openMembershipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeProfileDropdown();
      openProfilePopup(IDS.membership);
    });
  }

  const openAccountDetailsBtn = document.querySelector('.js-open-account-details-popup');
  if (openAccountDetailsBtn) {
    openAccountDetailsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeProfileDropdown();
      openProfilePopup(IDS.accountDetails);
    });
  }

  const openChangePasswordBtn = document.querySelector('.js-open-account-change-password-popup');
  if (openChangePasswordBtn) {
    openChangePasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeProfileDropdown();
      openProfilePopup(IDS.accountChangePassword);
    });
  }

  // --- My Donations flow: hub = donations-popup; sub-flows = change amount, setup, cancel confirm/canceled ---
  const openDonationsBtn = document.querySelector('.js-open-donations-popup');
  if (openDonationsBtn) {
    openDonationsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeProfileDropdown();
      openProfilePopup(IDS.donations);
    });
  }

  const donationsPopup = document.getElementById(IDS.donations);
  const changeMonthlyPopup = document.getElementById(IDS.changeMonthlyDonation);
  const monthlySetupPopup = document.getElementById(IDS.monthlyDonationSetup);
  if (donationsPopup) {
    donationsPopup.querySelector('.js-open-change-monthly-donation')?.addEventListener('click', () => {
      closeProfilePopup(donationsPopup);
      openProfilePopup(IDS.changeMonthlyDonation);
    });
    donationsPopup.querySelector('.js-open-monthly-donation-setup')?.addEventListener('click', () => {
      closeProfilePopup(donationsPopup);
      openProfilePopup(IDS.monthlyDonationSetup);
    });
    donationsPopup.querySelector('.js-cancel-monthly-donation')?.addEventListener('click', () => {
      closeProfilePopup(donationsPopup);
      openSharedPopup(IDS.cancelMonthlyDonationConfirm);
    });
  }
  if (changeMonthlyPopup) {
    changeMonthlyPopup.querySelector('.js-back-to-donations')?.addEventListener('click', () => {
      closeProfilePopup(changeMonthlyPopup);
      openProfilePopup(IDS.donations);
    });
  }
  if (monthlySetupPopup) {
    monthlySetupPopup.querySelector('.js-back-to-donations')?.addEventListener('click', () => {
      closeProfilePopup(monthlySetupPopup);
      openProfilePopup(IDS.donations);
    });
  }

  const changeMonthlyForm = document.querySelector('.js-change-monthly-donation-form');
  if (changeMonthlyForm && changeMonthlyPopup) {
    updateAmountDueState(changeMonthlyForm, 'changeMonthlyAmount', 'change-monthly-amount-due', 'change-monthly-amount-due-error');
    changeMonthlyForm.addEventListener('change', (e) => {
      if (e.target.matches('input[name="changeMonthlyAmount"]')) {
        updateAmountDueState(changeMonthlyForm, 'changeMonthlyAmount', 'change-monthly-amount-due', 'change-monthly-amount-due-error');
      } else if (e.target.matches('input, select, textarea')) {
        clearFieldErrorByTarget(changeMonthlyForm, e.target);
      }
    });
    changeMonthlyForm.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) clearFieldErrorByTarget(changeMonthlyForm, e.target);
    });
    changeMonthlyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validateFormWithRules(changeMonthlyForm, CHANGE_MONTHLY_DONATION_RULES);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      console.log('Change monthly donation form data:', Object.fromEntries(new FormData(changeMonthlyForm).entries()));
      changeMonthlyForm.reset();
      clearAllFormErrors(changeMonthlyForm);
      updateAmountDueState(changeMonthlyForm, 'changeMonthlyAmount', 'change-monthly-amount-due', 'change-monthly-amount-due-error');
      closeProfilePopup(changeMonthlyPopup);
      openSharedPopup(IDS.monthlyDonationUpdated);
    });
  }

  const monthlySetupForm = document.querySelector('.js-monthly-donation-setup-form');
  if (monthlySetupForm && monthlySetupPopup) {
    updateAmountDueState(monthlySetupForm, 'monthlySetupAmount', 'monthly-setup-amount-due', 'monthly-setup-amount-due-error');
    monthlySetupForm.addEventListener('change', (e) => {
      if (e.target.matches('input[name="monthlySetupAmount"]')) {
        updateAmountDueState(monthlySetupForm, 'monthlySetupAmount', 'monthly-setup-amount-due', 'monthly-setup-amount-due-error');
      } else if (e.target.matches('input, select, textarea')) {
        clearFieldErrorByTarget(monthlySetupForm, e.target);
      }
    });
    monthlySetupForm.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) clearFieldErrorByTarget(monthlySetupForm, e.target);
    });
    monthlySetupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validateFormWithRules(monthlySetupForm, MONTHLY_SETUP_RULES);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      console.log('Monthly donation setup form data:', Object.fromEntries(new FormData(monthlySetupForm).entries()));
      monthlySetupForm.reset();
      clearAllFormErrors(monthlySetupForm);
      updateAmountDueState(monthlySetupForm, 'monthlySetupAmount', 'monthly-setup-amount-due', 'monthly-setup-amount-due-error');
      closeProfilePopup(monthlySetupPopup);
      openProfilePopup(IDS.donations);
    });
  }

  const ACCOUNT_DETAILS_RULES = [
    { id: 'account-details-first-name', required: true, minLength: 2 },
    { id: 'account-details-last-name', required: true, minLength: 2 },
    { id: 'account-details-email', required: true, email: true },
  ];

  const CHANGE_PASSWORD_RULES = [
    { id: 'account-change-password-current', required: true },
    { id: 'account-change-password-new', required: true, passwordStrength: true },
  ];

  const CHANGE_MONTHLY_DONATION_RULES = [
    { type: 'radio', name: 'changeMonthlyAmount', errorId: 'changeMonthlyAmount-error' },
    {
      id: 'change-monthly-amount-due',
      errorId: 'change-monthly-amount-due-error',
      required: true,
      amount: true,
      when: (form) => form.querySelector('input[name="changeMonthlyAmount"]:checked')?.value === 'other',
    },
  ];

  const MONTHLY_SETUP_RULES = [
    { type: 'radio', name: 'monthlySetupAmount', errorId: 'monthlySetupAmount-error' },
    {
      id: 'monthly-setup-amount-due',
      errorId: 'monthly-setup-amount-due-error',
      required: true,
      amount: true,
      when: (form) => form.querySelector('input[name="monthlySetupAmount"]:checked')?.value === 'other',
    },
    { id: 'monthly-setup-first-name', required: true, minLength: 2 },
    { id: 'monthly-setup-last-name', required: true, minLength: 2 },
    { id: 'monthly-setup-email', required: true, email: true },
    {
      type: 'select',
      id: 'monthly-setup-country',
      errorId: 'monthly-setup-country-error',
      wrapperSelector: '[data-select-native-id="monthly-setup-country"]',
    },
    { id: 'monthly-setup-city', required: true },
    { id: 'monthly-setup-address', required: true },
    { id: 'monthly-setup-postcode', required: true },
  ];

  function updateAmountDueState(form, radioName, amountDueId, errorId) {
    const amountDueInput = form.querySelector(`#${amountDueId}`);
    const isOther = form.querySelector(`input[name="${radioName}"][value="other"]`)?.checked ?? false;
    if (!amountDueInput) return;
    if (isOther) {
      amountDueInput.removeAttribute('disabled');
      amountDueInput.setAttribute('required', '');
      amountDueInput.setAttribute('aria-required', 'true');
    } else {
      amountDueInput.setAttribute('disabled', '');
      amountDueInput.removeAttribute('required');
      amountDueInput.removeAttribute('aria-required');
      amountDueInput.value = '';
      clearErrorById(errorId);
      setValid(amountDueInput, errorId);
    }
  }

  const accountDetailsForm = document.querySelector('.js-account-details-form');
  const accountDetailsBackdrop = document.getElementById(IDS.accountDetails);
  if (accountDetailsForm && accountDetailsBackdrop) {
    accountDetailsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validateFormWithRules(accountDetailsForm, ACCOUNT_DETAILS_RULES);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(accountDetailsForm).entries());
      console.log('Account details form data:', data);
      accountDetailsForm.reset();
      clearAllFormErrors(accountDetailsForm);
      closeProfilePopup(accountDetailsBackdrop);
    });
    accountDetailsForm.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) clearFieldErrorByTarget(accountDetailsForm, e.target);
    });
  }

  const changePasswordForm = document.querySelector('.js-account-change-password-form');
  const changePasswordBackdrop = document.getElementById(IDS.accountChangePassword);
  if (changePasswordForm && changePasswordBackdrop) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validateFormWithRules(changePasswordForm, CHANGE_PASSWORD_RULES);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(changePasswordForm).entries());
      console.log('Change password form data:', data);
      changePasswordForm.reset();
      clearAllFormErrors(changePasswordForm);
      closeProfilePopup(changePasswordBackdrop);
    });
    changePasswordForm.addEventListener('input', (e) => {
      if (e.target.matches('input, select, textarea')) clearFieldErrorByTarget(changePasswordForm, e.target);
    });
  }

  if (membershipPopup) {
    membershipPopup.querySelector('.js-open-change-membership')?.addEventListener('click', () => {
      closeProfilePopup(membershipPopup);
      openProfilePopup(IDS.changeMembership);
    });
    membershipPopup.querySelector('.js-open-cancel-membership-confirm')?.addEventListener('click', () => {
      closeProfilePopup(membershipPopup);
      openSharedPopup(IDS.cancelConfirm);
    });
  }

  if (changeMembershipPopup) {
    changeMembershipPopup.querySelector('.js-back-to-membership')?.addEventListener('click', () => {
      closeProfilePopup(changeMembershipPopup);
      openProfilePopup(IDS.membership);
    });
    changeMembershipPopup.querySelectorAll('.js-select-level').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.application-membership__form-level-item');
        const levelName = item?.querySelector('.application-membership__form-level-item-title')?.textContent?.trim();
        const price = item?.querySelector('.application-membership__form-level-item-price')?.textContent?.trim();
        const newTitle = changeDetailsPopup?.querySelector('.profile-popup__content-item.new-level .profile-popup__content-item-title');
        const newPrice = changeDetailsPopup?.querySelector('.profile-popup__content-item.new-level .profile-popup__content-item-price');
        if (newTitle && levelName) newTitle.textContent = levelName;
        if (newPrice && price) newPrice.textContent = price;
        closeProfilePopup(changeMembershipPopup);
        openProfilePopup(IDS.changeMembershipDetails);
      });
    });
    changeMembershipPopup.querySelector('.js-open-change-membership-details')?.addEventListener('click', () => {
      closeProfilePopup(changeMembershipPopup);
      openProfilePopup(IDS.changeMembershipDetails);
    });
  }

  if (changeDetailsPopup) {
    changeDetailsPopup.querySelector('.js-back-to-change-membership')?.addEventListener('click', () => {
      closeProfilePopup(changeDetailsPopup);
      openProfilePopup(IDS.changeMembership);
    });
    changeDetailsPopup.querySelector('.js-confirm-level-change')?.addEventListener('click', () => {
      closeProfilePopup(changeDetailsPopup);
      openSharedPopup(IDS.levelUpdated);
    });
  }

  const cancelConfirmPopup = document.getElementById(IDS.cancelConfirm);
  if (cancelConfirmPopup) {
    cancelConfirmPopup.querySelector('.js-keep-membership')?.addEventListener('click', () => closePopup(cancelConfirmPopup));
    cancelConfirmPopup.querySelector('.js-cancel-membership-confirm')?.addEventListener('click', () => {
      closePopup(cancelConfirmPopup);
      openSharedPopup(IDS.membershipCanceled);
    });
  }

  const membershipCanceledPopup = document.getElementById(IDS.membershipCanceled);
  if (membershipCanceledPopup) {
    membershipCanceledPopup.querySelector('.js-membership-canceled-done')?.addEventListener('click', () => closePopup(membershipCanceledPopup));
  }

  const levelUpdatedPopup = document.getElementById(IDS.levelUpdated);
  if (levelUpdatedPopup) {
    levelUpdatedPopup.querySelector('.js-membership-level-updated-done')?.addEventListener('click', () => closePopup(levelUpdatedPopup));
  }

  // My Donations: cancel confirm and canceled success (.popup)
  const cancelMonthlyDonationConfirmPopup = document.getElementById(IDS.cancelMonthlyDonationConfirm);
  if (cancelMonthlyDonationConfirmPopup) {
    cancelMonthlyDonationConfirmPopup.querySelector('.js-keep-monthly-donation')?.addEventListener('click', () => {
      closePopup(cancelMonthlyDonationConfirmPopup);
      openProfilePopup(IDS.donations);
    });
    cancelMonthlyDonationConfirmPopup.querySelector('.js-cancel-monthly-donation-confirm')?.addEventListener('click', () => {
      closePopup(cancelMonthlyDonationConfirmPopup);
      openSharedPopup(IDS.monthlyDonationCanceled);
    });
  }

  const monthlyDonationCanceledPopup = document.getElementById(IDS.monthlyDonationCanceled);
  if (monthlyDonationCanceledPopup) {
    monthlyDonationCanceledPopup.querySelector('.js-monthly-donation-canceled-done')?.addEventListener('click', () => {
      closePopup(monthlyDonationCanceledPopup);
      openProfilePopup(IDS.donations);
    });
  }

  const monthlyDonationUpdatedPopup = document.getElementById(IDS.monthlyDonationUpdated);
  if (monthlyDonationUpdatedPopup) {
    monthlyDonationUpdatedPopup.querySelector('.js-monthly-donation-updated-done')?.addEventListener('click', () => {
      closePopup(monthlyDonationUpdatedPopup);
      openProfilePopup(IDS.donations);
    });
  }
}
