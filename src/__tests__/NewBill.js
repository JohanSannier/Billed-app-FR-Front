/* eslint-disable no-undef */
/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, screen } from '@testing-library/dom';
import { ROUTES } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import store from '../__mocks__/store';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import BillsUI from '../views/BillsUI.js';

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};
// On simule un statut d'employé
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
window.localStorage.setItem(
  'user',
  JSON.stringify({
    type: 'Employee',
  })
);

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then the newBill should be rendered', () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
    });
  });
});

describe("When I'm on NewBill Page", () => {
  describe('And I upload an image file', () => {
    test('Then the file extension is correct', () => {
      document.body.innerHTML = NewBillUI();
      //On instancie la classe NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const inputFile = screen.queryByTestId('file');

      //On écoute le changement
      inputFile.addEventListener('change', handleChangeFile);

      //On simule le changement
      fireEvent.change(inputFile, {
        target: {
          files: [new File(['test.jpg'], 'test.jpg', { type: 'image/jpg' })],
        },
      });

      //Aucun message d'erreur ne doit s'afficher
      const error = screen.queryByTestId('errorMessage');
      expect(error).toBeFalsy;
    });
  });

  describe('And I do not upload an image file', () => {
    test('Then the file extension is incorrect', () => {
      document.body.innerHTML = NewBillUI();
      //On instancie la classe NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const inputFile = screen.queryByTestId('file');

      //On écoute le changement
      inputFile.addEventListener('change', handleChangeFile);

      //On simule le changement
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(['foo'], 'foo.txt', {
              type: 'text/plain',
            }),
          ],
        },
      });

      //Un message d'erreur doit s'afficher
      const error = screen.queryByTestId('errorMessage');
      expect(error).toBeTruthy;
    });
  });
});

describe('When I submit a valid bill form', () => {
  test('Then a new bill is created', async () => {
    document.body.innerHTML = NewBillUI();
    const newBill = new NewBill({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });

    //On créé un newBill
    const submit = screen.queryByTestId('form-new-bill');
    const billTest = {
      name: 'Test-Bill',
      date: '2022-03-01',
      type: 'Hotel',
      amount: 245,
      pct: 20,
      vat: 20,
      commentary: 'Déplacement professionnel',
      fileName: 'testBill',
      fileUrl: 'testBill.jpg',
    };

    //On simule la fonction handleSubmit
    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

    //On applique les informations dans le DOM
    newBill.createBill = (newBill) => newBill;
    document.querySelector(`input[data-testid="expense-name"]`).value =
      billTest.name;
    document.querySelector(`input[data-testid="datepicker"]`).value =
      billTest.date;
    document.querySelector(`select[data-testid="expense-type"]`).value =
      billTest.type;
    document.querySelector(`input[data-testid="amount"]`).value =
      billTest.amount;
    document.querySelector(`input[data-testid="vat"]`).value = billTest.vat;
    document.querySelector(`input[data-testid="pct"]`).value = billTest.pct;
    document.querySelector(`textarea[data-testid="commentary"]`).value =
      billTest.commentary;
    newBill.fileUrl = billTest.fileUrl;
    newBill.fileName = billTest.fileName;

    submit.addEventListener('click', handleSubmit);

    //On simule un clic
    fireEvent.click(submit);

    //On vérifie que la fonction a été appelée
    expect(handleSubmit).toHaveBeenCalled();
  });
});

// Tests d'intégration POST
describe('Given I am a user connected as an employee', () => {
  describe('When I create a new bill and go back to the dashboard', () => {
    test('It fetches bills from the mocked API POST', async () => {
      const postSpy = jest.spyOn(store, 'post');
      const bills = await store.post();
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test('It fetches bills from the mocked API and fails with 404 message error', async () => {
      store.post.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 404'))
      );
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test('It fetches messages from the mocked API and fails with 500 message error', async () => {
      store.post.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 500'))
      );
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
