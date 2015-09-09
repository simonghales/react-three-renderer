import THREE from 'three';

import THREEElementDescriptor from './THREEElementDescriptor';

import events from 'events';
const {EventEmitter} = events;

function _arrayMove(array, oldIndex, newIndex) {
  array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
}

class Object3DDescriptor extends THREEElementDescriptor {
  constructor(react3Instance) {
    super(react3Instance);

    this._simpleProperties = [];

    this.propUpdates = {
      'position': this._updatePosition,
      'rotation': this._updateRotation,
      'lookAt': this._updateLookAt,
      'scale': this._updateScale,
      'name': this._updateName,
    };

    this.registerSimpleProperties([
      'castShadow',
      'receiveShadow',
      'visible',
    ]);
  }

  construct() {
    return new THREE.Object3D();
  }

  /**
   * @param {THREE.Object3D} threeObject
   * @param props
   */
  applyInitialProps(threeObject, props) {
    super.applyInitialProps(threeObject, props);

    if (props.position) {
      threeObject.position.copy(props.position);
    }

    if (props.scale) {
      threeObject.scale.copy(props.scale);
    }

    if (props.rotation) {
      threeObject.rotation.copy(props.rotation);
    }

    if (props.name) {
      threeObject.name = props.name;
    }

    if (props.lookAt) {
      threeObject.lookAt(props.lookAt);
    }

    threeObject.userData.events = new EventEmitter();

    this._simpleProperties.forEach(propertyName => {
      if (props.hasOwnProperty(propertyName)) {
        threeObject[propertyName] = props[propertyName];
      }

      this.propUpdates[propertyName] = (threeObject, nextValue) => {
        threeObject[propertyName] = nextValue;
      };
    });
  }

  _updatePosition = (threeObject, nextPosition) => {
    threeObject.position.copy(nextPosition);
  };

  _updateRotation = (threeObject, nextRotation) => {
    const {x, y, z} = threeObject.rotation;

    if (x !== nextRotation.x || y !== nextRotation.y || z !== nextRotation.z) {
      threeObject.rotation.copy(nextRotation);
    }
  };

  _updateScale = (threeObject, nextScale) => {
    threeObject.scale.copy(nextScale);
  };

  _updateName = (threeObject, nextName) => {
    const oldName = threeObject.name;

    threeObject.name = nextName;

    threeObject.userData.events.emit('rename', {
      oldName,
      nextName,
    });

    const markup = threeObject.userData.markup;

    if (markup._rootInstance) {
      markup._rootInstance.objectRenamed(self, oldName, nextName);
    }
  };

  _updateLookAt = (threeObject, lookAt) => {
    if (!!lookAt) {
      threeObject.lookAt(lookAt);
    }
  };

  /**
   * @param self
   * @param {Array} children
   */
  addChildren(self, children) {
    children.forEach(child => {
      self.add(child);
    });
  }

  /**
   * @param {THREE.Object3D} self
   * @param child
   */
  removeChild(self, child) {
    self.remove(child);
  }

  moveChild(self, childObject, toIndex, lastIndex) {
    _arrayMove(self.children, lastIndex, toIndex);
  }

  setParent(self, parentObject3D) {
    // yep that's allowed

    const parentMarkup = parentObject3D.userData.markup;

    if (parentMarkup && parentMarkup._rootInstance) {
      parentMarkup._rootInstance.objectMounted(self);
    }
  }

  unmount(self) {
    const markup = self.userData.markup;

    if (markup._rootInstance) {
      markup._rootInstance.objectRemoved(self);
    }

    self.userData.events.emit('dispose', {
      object: self,
    });

    self.userData.events.removeAllListeners();

    delete self.userData.events;
  }

  registerSimpleProperties(propertyNames) {
    this._simpleProperties = this._simpleProperties.concat(propertyNames);

    propertyNames.forEach(propertyName => {
      this.propUpdates[propertyName] = (threeObject, nextValue) => {
        threeObject[propertyName] = nextValue;
      };
    });
  }
}

export default Object3DDescriptor;