import React, { Component, Fragment } from 'react';
import logo from './logo.svg';
import './App.css';
import Demo from './riek-demo.js';
import Recipe from './Recipe.js';
import RecipeComponent from './RecipeComponent.js';
import axios from 'axios';

const domain = 'http://0be30ff24ef0.ngrok.io';

class App extends React.Component {
  state = { recipes: [], allComponents:[] };

  componentDidMount() {
    this.getIngredients();
    this.getComponents();
    this.getRecipes();
  }

  getRecipes = async () => {
    const response = await axios.get(`${domain}/recipes`);
    this.setState({ recipes: response.data.recipes });
  };

  getIngredients = async () => {
    const response = await axios.get(
      `${domain}/ingredients`
    );
    this.setState({ allIngredients: response.data.ingredients });
  };

  getComponents = async () => {
    const response = await axios.get(`${domain}/components`);
    console.log('-------------COMPONENTS-------------');
    console.log(JSON.stringify(response.data.components));
    this.setState({ allComponents: response.data.components });
  };

  render() {
    const recipeList = this.state.recipes.map((r) => (
      <Recipe
        key={r._id}
        name={r.name}
        description={r.description}
        avatar={r.avatar}
        components={r.components}
        ingredients={r.ingredients}
        nutrition={r.nutrition}
        price={r.price}
        weight={r.weight}
        cost={r.cost}
        type={r.type}
        allIngredients={this.state.allIngredients}
      />
    ));
    
    const componentsList = this.state.allComponents.map((c) => (
      <RecipeComponent
        key={c._id}
        id={c._id}
        name={c.name}
        description={c.description}
        avatar={c.avatar}
        ingredients={c.ingredients}
        nutrition={c.nutrition}
        weight={c.weight}
        allIngredients={this.state.allIngredients}
      />
    ));

    return (
      <Fragment>
        <div className="ui container" style={{ marginTop: '10px' }}>
          Found: {this.state.recipes.length} recipes
          <ul>{recipeList}</ul>
        </div>
        <div className="ui container" style={{ marginTop: '10px' }}>
          Found: {this.state.allComponents.length} components
          <ul>{componentsList}</ul>
        </div>
      </Fragment>
    );
  }
}

export default App;
