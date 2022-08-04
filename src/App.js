import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Dropdown from "react-bootstrap/Dropdown";
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

function downloadURI(uri, name) {
  let link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const Tools = {
  HAND: 0,
  PENCIL: 1,
  ERASER: 2,
};

const Colors = {
  BLACK: "black",
  RED: "red",
  GREEN: "green",
  BLUE: "blue",
  YELLOW: "yellow",
  PURPLE: "purple",
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
    };

    this.canvas = React.createRef();

    this.redrawCanvas = this.redrawCanvas.bind(this);
    this.fitCanvasToWindow = this.fitCanvasToWindow.bind(this);
    this.setTool = this.setTool.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.beginDrawing = this.beginDrawing.bind(this);
    this.endDrawing = this.endDrawing.bind(this);
    this.draw = this.draw.bind(this);
    this.adjustX = this.adjustX.bind(this);
    this.adjusty = this.adjustY.bind(this);
    this.drawLineTo = this.drawLineTo.bind(this);
    this.saveImage = this.saveImage.bind(this);

    window.addEventListener("resize", this.fitCanvasToWindow);
  }

  redrawCanvas(dataURL, offsetX = 0, offsetY = 0) {
    const canvas = this.canvas.current;
    let img = new Image();
    img.onload = function () {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, offsetX, offsetY);
    };
    img.src = dataURL;
  }

  getFitWidth(canvasWidth, canvasX) {
    const effectiveWidth = canvasWidth - canvasX;
    if (effectiveWidth < window.innerWidth) {
      canvasWidth += window.innerWidth - effectiveWidth;
    }
    return canvasWidth;
  }

  getFitHeight(canvasHeight, canvasY) {
    const effectiveHeight = canvasHeight - canvasY;
    if (effectiveHeight < window.innerHeight) {
      canvasHeight += window.innerHeight - effectiveHeight;
    }
    return canvasHeight;
  }

  fitCanvasToWindow(e) {
    const canvas = this.canvas.current;
    if (canvas === null) {
      return;
    }

    const { canvasWidth, canvasHeight, canvasX, canvasY } = this.state;
    const dataURL = this.canvas.current.toDataURL();
    this.setState(
      {
        canvasWidth: this.getFitWidth(canvasWidth, canvasX),
        canvasHeight: this.getFitHeight(canvasHeight, canvasY),
      },
      () => {
        this.redrawCanvas(dataURL);
      }
    );
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
    let { canvasX, canvasY, canvasWidth, canvasHeight } = this.state;

    if (canvasX > 0) {
      negativeExpandX = true;

      canvasWidth += canvasX;
    } else {
      canvasX = -canvasX; // absolute value

      canvasWidth = this.getFitWidth(canvasWidth, canvasX);
    }

    if (canvasY > 0) {
      negativeExpandY = true;

      canvasHeight += canvasY;
    } else {
      canvasY = -canvasY; // absolute value

      canvasHeight = this.getFitHeight(canvasHeight, canvasY);
    }

    const dataURL = canvas.toDataURL();
    this.setState(
      {
        moving: false,
        canvasX: (1 - negativeExpandX) * -canvasX,
        canvasY: (1 - negativeExpandY) * -canvasY,
        canvasWidth,
        canvasHeight,
      },
      () => {
        let img = new Image();
        img.onload = function () {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            negativeExpandX * canvasX,
            negativeExpandY * canvasY
          );
        };
        img.src = dataURL;
      }
    );
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

  adjustX(x) {
    return x - this.state.canvasX;
  }

  adjustY(y) {
    return y - this.state.canvasY;
  }

  drawLineTo(x1, y1, emit) {
    const x0 = this.state.x;
    const y0 = this.state.y;
    const color = this.state.color;

    const ctx = this.canvas.current.getContext("2d").canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(this.adjustX(x0), this.adjustY(y0));
    ctx.lineTo(this.adjustX(x1), this.adjustY(y1));
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

  saveImage(e) {
    const dataURL = this.canvas.current.toDataURL();
    downloadURI(dataURL, "whiteboard.png");
  }

  render() {
    const colors = Object.keys(Colors).map((name) => (
      <Dropdown.Item
        key={name}
        style={{ backgroundColor: Colors[name], color: Colors[name] }}
        onClick={() => this.setState({ color: Colors[name] })}
      >
        {Colors[name]}
      </Dropdown.Item>
    ));

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
              <ButtonToolbar className="my-3 justify-content-center">
                <ButtonGroup size="lg">
                  <Button
                    variant="primary"
                    active={this.state.activeTool === Tools.HAND}
                    onClick={() => this.setTool(Tools.HAND)}
                  >
                    <FontAwesomeIcon icon={faHand} />
                  </Button>
                  {/* work in progress */}
                  <Dropdown as={ButtonGroup}>
                    <Button
                      variant="primary"
                      active={this.state.activeTool === Tools.PENCIL}
                      onClick={() => this.setTool(Tools.PENCIL)}
                      style={{ borderRight: "0" }}
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </Button>
                    <Dropdown.Toggle
                      split
                      variant="primary"
                      active={this.state.activeTool === Tools.PENCIL}
                      onClickCapture={() => this.setTool(Tools.PENCIL)}
                      style={{ borderLeft: "0" }}
                    ></Dropdown.Toggle>
                    <Dropdown.Menu>{colors}</Dropdown.Menu>
                  </Dropdown>
                  {/* end of work in progress */}
                  <Button
                    variant="primary"
                    active={this.state.activeTool === Tools.ERASER}
                    onClick={() => this.setTool(Tools.ERASER)}
                  >
                    <FontAwesomeIcon icon={faEraser} />
                  </Button>
                  <Button variant="success" onClick={this.saveImage}>
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
