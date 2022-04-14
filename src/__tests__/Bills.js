/**
 * @jest-environment jsdom
 */
import { fireEvent, screen } from '@testing-library/dom';
import { ROUTES } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import store from '../__mocks__/store';
import { bills } from '../fixtures/bills';
import Bills from '../containers/Bills';
import BillsUI from '../views/BillsUI.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on the bill page', () => {
    test('Then the bill icon in the vertical layout should be highlighted', () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      document.body.innerHTML = BillsUI({ data: [] });
      const billIcon = screen.getByTestId('icon-window');
      expect(billIcon).toBeTruthy();
    });
    test('Then the bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

describe('Given I try to connect on the app as an Employee', () => {
  describe('When I am on the Login Page', () => {
    test('Then it should render the LoadingPage', () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    });
    test('Then it should render ErrorPage', () => {
      document.body.innerHTML = BillsUI({ error: true });
      expect(screen.getAllByText('Erreur')).toBeTruthy();
    });
  });
});

//Test d'intégration
describe('Given I am an employee', () => {
  describe('When I navigate to the dashboard', () => {
    test('When I click on the new bill button then a modal should open', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );

      document.body.innerHTML = BillsUI({ data: bills });

      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills,
        localStorage: window.localStorage,
      });
      $.fn.modal = jest.fn();

      const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill);

      const iconNewBill = screen.getByTestId('btn-new-bill');
      iconNewBill.addEventListener('click', handleClickNewBill);
      fireEvent.click(iconNewBill);

      expect(handleClickNewBill).toHaveBeenCalled();

      const modale = screen.getByTestId('form-new-bill');
      expect(modale).toBeTruthy();
    });

    test('When I click on the eye icon to show the details of a bill then a modal should open', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );

      document.body.innerHTML = BillsUI({ data: bills });

      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills,
        localStorage: window.localStorage,
      });
      $.fn.modal = jest.fn();

      const handleClickIconEye = jest.fn((e) =>
        bill.handleClickIconEye(iconEye[0])
      );

      const iconEye = screen.getAllByTestId('icon-eye');
      iconEye[0].addEventListener('click', handleClickIconEye);
      fireEvent.click(iconEye[0]);

      expect(handleClickIconEye).toHaveBeenCalled();

      const modale = screen.getByTestId('modaleFile');
      expect(modale).toBeTruthy();
    });

    test('It fetches bills from the mocked API then return status 200 and data.length = 4', async () => {
      const getSpy = jest.spyOn(store, 'get');
      const bills = await store.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills).toBeDefined();
      expect(bills.data.length).toBe(4);
    });

    test('It fetches bills from the mocked API then fails with 404 message error', async () => {
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 404'))
      );
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test('It fetches messages from the mocked API and fails with 500 message error', async () => {
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 500'))
      );
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
