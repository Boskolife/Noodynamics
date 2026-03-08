/**
 * Profile / membership popup flow.
 * - "My membership" in header dropdown -> open membership-popup.
 * - Membership: "Change membership level" -> change-membership-popup; "Cancel membership" -> cancel-membership-confirm (.popup).
 * - Change-membership: "Select" on a level -> open change-membership-details; "Back" -> membership-popup; "Continue" -> details (if level selected).
 * - Change-membership-details: "Confirm" -> membership-level-updated (.popup); "Back" -> change-membership-popup.
 * - Cancel-membership-confirm: "Keep" -> close; "Cancel my membership" -> membership-canceled (.popup).
 * - Membership-canceled / membership-level-updated: "Done" -> close.
 */

import { closePopup } from './auth-popup.js';
import {
  MESSAGES,
  validateEmail,
  validatePasswordStrength,
  setInvalid,
  setValid,
  getInputValue,
  clearAllFormErrors,
} from '../forms/validation.js';

const OPEN_CLASS = 'is-open';
const PROFILE_POPUP_SELECTOR = '.profile-popup';
const PROFILE_DROPDOWN_ID = 'header-profile-dropdown';
const PROFILE_BTN_SELECTOR = '.js-header-profile';

const IDS = {
  membership: 'membership-popup-backdrop',
  accountDetails: 'account-details-popup-backdrop',
  accountChangePassword: 'account-change-password-popup-backdrop',
  changeMembership: 'change-membership-popup-backdrop',
  changeMembershipDetails: 'change-membership-details-popup-backdrop',
  cancelConfirm: 'cancel-membership-confirm-popup-backdrop',
  membershipCanceled: 'membership-canceled-popup-backdrop',
  levelUpdated: 'membership-level-updated-popup-backdrop',
};

function closeProfilePopup(backdrop) {
  if (!backdrop) return;
  if (backdrop.contains(document.activeElement)) {
    (document.activeElement instanceof HTMLElement) && document.activeElement.blur();
  }
  backdrop.classList.remove(OPEN_CLASS);
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function closeOpenProfilePopups() {
  document.querySelectorAll(`${PROFILE_POPUP_SELECTOR}.${OPEN_CLASS}`).forEach(closeProfilePopup);
}

function closeOpenAuthPopups() {
  const open = document.querySelector('.popup.is-open');
  if (open) closePopup(open);
}

function openProfilePopup(id) {
  closeOpenAuthPopups();
  closeOpenProfilePopups();
  const backdrop = document.getElementById(id);
  if (!backdrop) return;
  backdrop.classList.add(OPEN_CLASS);
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const focusTarget = backdrop.querySelector('button:not(.profile-popup__close), [href], input');
  focusTarget?.focus();
}

function openSharedPopup(id) {
  closeOpenProfilePopups();
  closeOpenAuthPopups();
  const backdrop = document.getElementById(id);
  if (!backdrop) return;
  backdrop.classList.add(OPEN_CLASS);
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const focusTarget = backdrop.querySelector('button:not(.popup__close), [href], input');
  focusTarget?.focus();
}

function closeProfileDropdown() {
  const dropdown = document.getElementById(PROFILE_DROPDOWN_ID);
  const profileBtn = document.querySelector(PROFILE_BTN_SELECTOR);
  if (dropdown) dropdown.hidden = true;
  if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
}

export function initProfilePopups() {
  const membershipPopup = document.getElementById(IDS.membership);
  const changeMembershipPopup = document.getElementById(IDS.changeMembership);
  const changeDetailsPopup = document.getElementById(IDS.changeMembershipDetails);

  document.querySelectorAll(PROFILE_POPUP_SELECTOR).forEach((backdrop) => {
    backdrop.querySelector('.profile-popup__overlay')?.addEventListener('click', () => closeProfilePopup(backdrop));
    backdrop.querySelector('.profile-popup__close')?.addEventListener('click', () => closeProfilePopup(backdrop));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openProfile = document.querySelector(`${PROFILE_POPUP_SELECTOR}.${OPEN_CLASS}`);
    if (openProfile) {
      e.preventDefault();
      closeProfilePopup(openProfile);
    }
  });

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

  const accountDetailsForm = document.querySelector('.js-account-details-form');
  const accountDetailsBackdrop = document.getElementById(IDS.accountDetails);
  if (accountDetailsForm && accountDetailsBackdrop) {
    const { required, email: emailMsg, nameMinLength } = MESSAGES;
    const fields = [
      { id: 'account-details-first-name', errorId: 'account-details-first-name-error', minLength: 2 },
      { id: 'account-details-last-name', errorId: 'account-details-last-name-error', minLength: 2 },
      { id: 'account-details-email', errorId: 'account-details-email-error', email: true },
    ];
    const validate = () => {
      let firstInvalid = null;
      for (const { id, errorId, minLength, email } of fields) {
        const input = accountDetailsForm.querySelector(`#${id}`);
        const value = getInputValue(input);
        if (!value) {
          setInvalid(input, required, errorId);
          if (!firstInvalid) firstInvalid = input;
        } else if (minLength && value.length < minLength) {
          setInvalid(input, nameMinLength, errorId);
          if (!firstInvalid) firstInvalid = input;
        } else if (email && !validateEmail(value)) {
          setInvalid(input, emailMsg, errorId);
          if (!firstInvalid) firstInvalid = input;
        } else {
          setValid(input, errorId);
        }
      }
      return firstInvalid;
    };
    accountDetailsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validate();
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
      if (e.target.matches('input, select, textarea') && e.target.id) {
        setValid(e.target, `${e.target.id}-error`);
      }
    });
  }

  const changePasswordForm = document.querySelector('.js-account-change-password-form');
  const changePasswordBackdrop = document.getElementById(IDS.accountChangePassword);
  if (changePasswordForm && changePasswordBackdrop) {
    const { required, passwordStrength: passwordStrengthMsg } = MESSAGES;
    const currentInput = changePasswordForm.querySelector('#account-change-password-current');
    const newInput = changePasswordForm.querySelector('#account-change-password-new');
    const validate = () => {
      let firstInvalid = null;
      const current = getInputValue(currentInput);
      const newVal = getInputValue(newInput);
      if (!current) {
        setInvalid(currentInput, required, 'account-change-password-current-error');
        if (!firstInvalid) firstInvalid = currentInput;
      } else {
        setValid(currentInput, 'account-change-password-current-error');
      }
      if (!newVal) {
        setInvalid(newInput, required, 'account-change-password-new-error');
        if (!firstInvalid) firstInvalid = newInput;
      } else if (!validatePasswordStrength(newVal)) {
        setInvalid(newInput, passwordStrengthMsg, 'account-change-password-new-error');
        if (!firstInvalid) firstInvalid = newInput;
      } else {
        setValid(newInput, 'account-change-password-new-error');
      }
      return firstInvalid;
    };
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstInvalid = validate();
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
      if (e.target.matches('input, select, textarea') && e.target.id) {
        setValid(e.target, `${e.target.id}-error`);
      }
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
}
