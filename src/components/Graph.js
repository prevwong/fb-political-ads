import React from "react";
import {Layout} from "element-react";

export const Graph = ({ visualisation}) => {
  
  return (
    <Layout.Row gutter="10">
      <Layout.Col span="24">
        <div className="graph-container">
          {React.createElement(visualisation)}
        </div>
      </Layout.Col>
    </Layout.Row>
  )
}