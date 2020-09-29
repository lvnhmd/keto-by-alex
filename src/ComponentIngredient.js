import React, { Component } from 'react';
import { RIEInput, RIESelect } from 'riek';

class ComponentIngredient extends Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: props.amount,
      energy: props.energy,
      fat: props.fat,
      carbs: props.carbs,
      protein: props.protein,
      price: props.price,
      select: { id: props._id, text: props.name },
    };
  }

  getCategoryOptions = () =>
    this.props.allIngredients[this.props.category].map((i) => ({
      id: i._id,
      text: i.name,
    }));

  calculatePriceForAmount = () => {
    const { price, amount } = this.state;
    const { packageSize } = this.props;
    const pfa = (price / packageSize) * amount;
    return pfa ? Number(pfa).toFixed(2) : 0;
  };

  calculateMicroForAmount = (micro) =>
    Number(
      (this.state[micro] / this.props.serving) * this.state.amount
    ).toFixed(2);

  setStateOnIngredientChange = (newState) => {
    // this.setState(newState);
    console.log('setStateOnIngredientChange');
  };

  setStateOnAmountChange = (newState) => {
    // this.setState(newState);
    console.log('setStateOnAmountChange');
  };

  render() {
    return (
      <tr className="table-warning">
        <td>
          <RIESelect
            value={this.state.select}
            className="form-control"
            options={this.getCategoryOptions()}
            change={this.setStateOnIngredientChange}
            classLoading="loading"
            propName="select"
          />
        </td>
        <td>{this.calculateMicroForAmount('carbs')}</td>
        <td>{this.calculateMicroForAmount('energy')}</td>
        <td>{this.calculateMicroForAmount('fat')}</td>
        <td>{this.calculateMicroForAmount('protein')}</td>
        <td>
          <RIEInput
            value={this.state.amount}
            change={this.setStateOnAmountChange}
            propName="amount"
            className="form-control"
          />
        </td>
        <td>{this.calculateIngredientPriceForAmount()}</td>
        <td>
          {/* <button
            type="button"
            class="btn"
            onClick={this.setStateOnIngredientRemoved.bind(this, ing.id)}
          >
            <svg
              width="2em"
              height="2em"
              viewBox="0 0 16 16"
              class="bi bi-x"
              fill="red"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
              ></path>
            </svg>
          </button> */}
        </td>
      </tr>
    );
  }
}

export default ComponentIngredient;
