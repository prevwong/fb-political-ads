import React from "react";
import {Layout} from "element-react";

export const Container = ({preface, title, subtitle, children}) => {
  return (
    <Layout.Row gutter="10">
      <Layout.Col span="24">
        <div style={{paddingLeft:"50px", paddingRight: "50px", paddingBottom: "40px"}}>
          <h1>
            {preface ? <small>{preface}</small> : null}
            <br/>{title}
            {subtitle ? <small className="hero-subtitle">{subtitle}</small> : null}
          </h1>
          {children}
          </div>
          
      </Layout.Col>
    </Layout.Row>
  )
}