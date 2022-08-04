import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHand,
  faPencil,
  faEraser,
  faFileArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import React, { Component } from "react";

function throttle(callback, delay) {
  var previousCall = new Date().getTime();
  return function () {
    var time = new Date().getTime();

    if (time - previousCall >= delay) {
      previousCall = time;
      callback.apply(null, arguments);
    }
  };
}

const Tools = {
  HAND: 0,
  PENCIL: 1,
  ERASER: 2,
};

export default class App extends Component {
  constructor(props) {
    super(props);

    let uid = Math.floor(Math.random() * 10000); // mock uid, that would normally be extracted from the jwt token sent by the server after authentication

    this.state = {
      uid: uid,
      activeTool: Tools.HAND,
      drawing: false,
      moving: false,
      x: 0,
      y: 0,
      color: "black",
      canvasX: 0,
      canvasY: 0,
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
      saveURL: "",
    };

    this.canvas = React.createRef();

    this.setTool = this.setTool.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.beginDrawing = this.beginDrawing.bind(this);
    this.endDrawing = this.endDrawing.bind(this);
    this.draw = this.draw.bind(this);
    this.drawLineTo = this.drawLineTo.bind(this);
  }

  setTool(tool) {
    this.setState({ activeTool: tool });
  }

  onMouseDown(e) {
    switch (this.state.activeTool) {
      case Tools.HAND:
        this.beginMoving(e);
        break;
      case Tools.PENCIL:
        this.beginDrawing(e);
        break;
      case Tools.ERASER:
        break;
      default:
        console.error("Invalid tool.");
        break;
    }
  }

  onMouseUp(e) {
    switch (this.state.activeTool) {
      case Tools.HAND:
        this.endMoving(e);
        break;
      case Tools.PENCIL:
        this.endDrawing(e);
        break;
      case Tools.ERASER:
        break;
      default:
        console.error("Invalid tool.");
        break;
    }
  }

  onMouseOut(e) {
    switch (this.state.activeTool) {
      case Tools.HAND:
        this.endMoving(e);
        break;
      case Tools.PENCIL:
        this.endDrawing(e);
        break;
      case Tools.ERASER:
        break;
      default:
        console.error("Invalid tool.");
        break;
    }
  }

  onMouseMove(e) {
    switch (this.state.activeTool) {
      case Tools.HAND:
        this.move(e);
        break;
      case Tools.PENCIL:
        this.draw(e);
        break;
      case Tools.ERASER:
        break;
      default:
        console.error("Invalid tool.");
        break;
    }
  }

  beginMoving(e) {
    this.setState({ moving: true });
  }

  move(e) {
    if (!this.state.moving) {
      return;
    }
    this.setState({
      canvasX: this.state.canvasX + e.movementX,
      canvasY: this.state.canvasY + e.movementY,
    });
  }

  endMoving(e) {
    if (!this.state.moving) {
      return;
    }
    const canvas = this.canvas.current;
    let negativeExpandX = false;
    let negativeExpandY = false;
    let dataURL = null;
    let { canvasX, canvasY, canvasWidth, canvasHeight } = this.state;

    if (canvasX > 0) {
      negativeExpandX = true;
    } else {
      canvasX = -canvasX;
    }
    canvasWidth += canvasX;

    if (canvasY > 0) {
      negativeExpandY = true;
    } else {
      canvasY = -canvasY;
    }
    canvasHeight += canvasY;

    if (negativeExpandX || negativeExpandY) {
      dataURL = canvas.toDataURL();
      this.setState({ saveURL: dataURL });
    }

    this.setState({
      moving: false,
      canvasX: 0,
      canvasY: 0,
      canvasWidth,
      canvasHeight,
    });

    if (negativeExpandX || negativeExpandY) {
      let img = new Image();
      img.onload = function () {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(
          img,
          negativeExpandX * canvasX,
          negativeExpandY * canvasY
        );
        console.log(dataURL);
      };
      img.src = dataURL;
    }
  }

  beginDrawing(e) {
    this.setState({ drawing: true, x: e.clientX, y: e.clientY });
  }

  draw(e) {
    if (!this.state.drawing) {
      return;
    }
    this.drawLineTo(e.clientX, e.clientY, true);
    this.setState({ x: e.clientX, y: e.clientY });
  }

  drawLineTo(x1, y1, emit) {
    const x0 = this.state.x;
    const y0 = this.state.y;
    const color = this.state.color;

    const ctx = this.canvas.current.getContext("2d").canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    if (!emit) {
      return;
    }

    // TODO: network
  }

  endDrawing(e) {
    if (!this.state.drawing) {
      return;
    }
    this.setState({ drawing: false });
    this.drawLineTo(e.clientX, e.clientY, true);
  }

  render() {
    return (
      <>
        <canvas
          ref={this.canvas}
          width={this.state.canvasWidth}
          height={this.state.canvasHeight}
          style={{ left: this.state.canvasX, top: this.state.canvasY }}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onMouseOut={this.onMouseOut}
          onMouseMove={throttle(this.onMouseMove, 10)}
        >
          Your browser does not support the HTML canvas tag.
        </canvas>
        <Container fluid>
          <Row>
            <Col>
              <ButtonToolbar className="my-2 justify-content-center">
                <ButtonGroup size="lg">
                  <Button
                    variant="primary"
                    active={this.state.activeTool === Tools.HAND}
                    onClick={() => this.setTool(Tools.HAND)}
                  >
                    <FontAwesomeIcon icon={faHand} />
                  </Button>
                  <Button
                    variant="primary"
                    active={this.state.activeTool === Tools.PENCIL}
                    onClick={() => this.setTool(Tools.PENCIL)}
                  >
                    <FontAwesomeIcon icon={faPencil} />
                  </Button>
                  <Button
                    variant="primary"
                    active={this.state.activeTool === Tools.ERASER}
                    onClick={() => this.setTool(Tools.ERASER)}
                  >
                    <FontAwesomeIcon icon={faEraser} />
                  </Button>
                  <Button variant="success" href={this.state.saveURL}>
                    <FontAwesomeIcon icon={faFileArrowDown} />
                  </Button>
                </ButtonGroup>
              </ButtonToolbar>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}
