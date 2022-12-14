import { usePrevious } from 'ahooks';
import { ConfigProvider, Form } from 'antd';
import { NamePath } from 'antd/es/form/interface';
import classNames from 'classnames';
import deepEqual from 'deep-equal';
import omit from 'omit.js';
import useMergedState from 'rc-util/es/hooks/useMergedState';
import get from 'rc-util/es/utils/get';
import set from 'rc-util/es/utils/set';
import { noteOnce } from 'rc-util/es/warning';
import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type FC,
} from 'react';
import AppSubmitter from '../AppSubmitter';
import { AppProFormContext, AppProFormEditOrReadOnlyContext } from '../context';
import { useFetchData, useRefFn } from '../hooks';
import { runFunction } from '../utils';
import { GridContext } from './context';
import { useGridHelpers } from './helpers';
import {
  AppProFormInstance,
  IAppBaseFormComponentsProps,
  IAppBaseFormProps,
} from './typing';

/**
 * form的name装换成数组 ['name']
 * @param name
 */
const covertFormName = (name?: NamePath) => {
  if (!name) return name;
  if (Array.isArray(name)) return name;
  return [name];
};

/**
 * 返回原始的参数
 * @param syncUrl 同步url
 * @param params 参数
 * @param type 类型，是get还是set
 */
const referenceParams = (
  syncUrl: IAppBaseFormProps<any>['syncToUrl'],
  params: Record<string, any>,
  type: 'get' | 'set',
) => {
  if (syncUrl === true) {
    return params;
  }
  return runFunction(syncUrl, params, type);
};

/**
 * 基础表单的组件
 * @param props
 * @constructor
 */
const AppBaseFormComponents: FC<IAppBaseFormComponentsProps> = (props) => {
  const {
    contentRender,
    children,
    autoFocusFirstInput = true,
    submitter,
    loading,
    form,
    formRef,
    formType,
    isKeyPressSubmit,
    onReset,
    omitNlUd = true,
    transformKey,
    syncToUrl,
    extraUrlParams = {},
    grid,
    colProps,
    rowProps,
    onInit,
    onUrlSearchChange,
    ...otherProps
  } = props;

  /**
   * 获取antd提供出来的size注入，从而控制组件大小
   */
  const sizeContextValue = useContext(ConfigProvider.SizeContext);

  /**
   * form实例
   */
  const formInstance = Form.useFormInstance();

  const { RowWrapper } = useGridHelpers({ grid, rowProps });

  /**
   * 使用useRefFn获取到组件的实例数据
   */
  const getFormInstance = useRefFn(() => formInstance);

  /**
   * 格式化数据
   */
  const formatValues = useMemo(() => {
    return {
      /**
       * 获取格式化之后的数据
       * @param allData boolean
       */
      getFieldsFormatValue: (allData?: true) =>
        transformKey(getFormInstance()?.getFieldsValue(allData!), omitNlUd),
      /**
       * 获取格式化之后的单个数据
       * @param paramsNameList
       */
      getFieldFormatValue: (paramsNameList: NamePath = []) => {
        const nameList = covertFormName(paramsNameList);
        if (!nameList) throw new Error('nameList不能为空');
        // nameList!是作为非空判断，这里就一个语法而已
        const value = getFormInstance().getFieldValue(nameList!);
        const obj = nameList ? set({}, nameList as string[], value) : value;
        return get(transformKey(obj, omitNlUd, nameList), nameList as string[]);
      },
      /**
       * 获取格式化之后的单个数据
       * 获取的值为 {key： {key： value}}
       * @param paramsNameList
       */
      getFieldFormatValueObject: (paramsNameList?: NamePath) => {
        const nameList = covertFormName(paramsNameList);
        const value = getFormInstance()?.getFieldValue(nameList!);
        const obj = nameList ? set({}, nameList as string[], value) : value;
        return transformKey(obj, omitNlUd, nameList);
      },
      /**
       * 验证字段之后返回格式化之后的所有数据
       * @param nameList (string|number[])
       */
      validateFieldsReturnFormatValue: async (nameList?: NamePath[]) => {
        if (nameList && Array.isArray(nameList))
          throw new Error('nameList必须是一个数组');
        const values = await getFormInstance().validateFields(nameList);
        // 转换完成的
        const transformedKey = transformKey(values, omitNlUd);
        return transformedKey ? transformedKey : {};
      },
      formRef,
    };
  }, [omitNlUd, transformKey]);

  /**
   * 返回表单的item
   */
  const formItems = useMemo(() => {
    /**
     * 将children转成数组并且返回克隆该组件返回一个新的组件
     */
    return React.Children.toArray(children as any).map((item, index) => {
      /**
       * 第一个表单item获取聚焦，当autoFocusFirstInput为真
       * isValidElement 验证是否是一个ele
       */
      if (index === 0 && autoFocusFirstInput && isValidElement(item)) {
        return cloneElement(item, {
          ...item.props,
          autoFocus: autoFocusFirstInput,
        });
      }
      return item;
    });
  }, [autoFocusFirstInput, children]);

  /**
   * 暴露出表单项的ref给外部使用
   */
  useImperativeHandle(
    formRef,
    () => {
      return {
        ...formRef?.current,
        ...formatValues,
      };
    },
    [],
  );

  /**
   * 获取自定义提交的props
   */
  const submitterProps = useMemo(
    () => (typeof submitter === 'boolean' || !submitter ? {} : submitter),
    [submitter],
  );

  /**
   * 重置操作
   */
  const handleReset = () => {
    // 获取最后的值
    const finalValues = transformKey(
      formRef?.current?.getFieldsValue(),
      omitNlUd,
    );
    // 清除数据
    submitterProps?.onReset?.(finalValues);
    onReset?.(finalValues);
    // 同步url
    if (syncToUrl) {
      // 获取参数，使用reduce进行参数的累加计算
      const params = Object.keys(
        transformKey(formRef?.current?.getFieldsValue(), false),
      ).reduce((pre, next) => {
        return {
          ...pre,
          [next]: finalValues[next] || undefined,
        };
      }, extraUrlParams);
      onUrlSearchChange?.(referenceParams(syncToUrl, params, 'set'));
    }
  };

  /**
   * 渲染提交按钮和重置按钮
   */
  const submitterNode = useMemo(() => {
    if (!submitter) return undefined;
    return (
      <AppSubmitter
        key="submitter"
        {...submitterProps}
        onReset={handleReset}
        submitButtonProps={{ loading, ...submitterProps?.submitButtonProps }}
      ></AppSubmitter>
    );
  }, [
    submitter,
    loading,
    submitterProps,
    transformKey,
    onReset,
    omitNlUd,
    syncToUrl,
    extraUrlParams,
    onUrlSearchChange,
  ]);

  /**
   * 渲染内容
   */
  const content = useMemo(() => {
    const wrapItems = grid ? <RowWrapper>{formItems}</RowWrapper> : formItems;
    if (contentRender) {
      return contentRender(wrapItems, submitterNode, formRef?.current);
    }
    return wrapItems;
  }, [formItems, contentRender, submitterNode, grid, formItems]);

  /**
   * 获取上一次初始值
   */
  const preInitialValues = usePrevious(props.initialValues);

  useEffect(() => {
    if (
      syncToUrl ||
      !props.initialValues ||
      !preInitialValues ||
      otherProps.request
    )
      return;
    // 相等对比，采用严格相等进行对比
    const isEqual = deepEqual(props?.initialValues, preInitialValues, {
      strict: true,
    });
    noteOnce(
      isEqual,
      'initialValues只会在form初始化的时候生效，如果需要异步加载推荐使用request，或者是initialValues ? <Form/> : null',
    );
  }, [props?.initialValues]);
  /**
   * 获取当前表单最后的值
   */
  useEffect(() => {
    const finalValues = transformKey(
      formRef?.current.getFieldsValue?.(true),
      omitNlUd,
    );
    onInit?.(finalValues, formRef?.current);
  }, []);

  return (
    <AppProFormContext.Provider value={formatValues}>
      <ConfigProvider.SizeContext.Provider
        value={otherProps.size || sizeContextValue}
      >
        <GridContext.Provider value={{ grid, colProps }}>
          {content}
        </GridContext.Provider>
      </ConfigProvider.SizeContext.Provider>
    </AppProFormContext.Provider>
  );
};

/**
 * 请求表单触发的id
 */
let requestFormCacheId = 0;

const AppBaseForm: FC<IAppBaseFormProps> = (props) => {
  const {
    children,
    contentRender,
    fieldProps,
    formType,
    formItemProps,
    onInit,
    form,
    formRef: propsFormRef,
    initialValues,
    request,
    params,
    formKey = requestFormCacheId,
    omitNlUd,
    ...otherProps
  } = props;
  // 表单的ref
  const formRef = useRef<AppProFormInstance<any>>({} as any);
  const [loading, setLoading] = useMergedState<boolean>(false);
  /**
   * 表单的提交
   */
  const handleFinish = useRefFn(async () => {});

  /**
   * 装换数据格式
   */
  const transformKey = useCallback(
    (values: any, paramsOmitNlUn: boolean, parentKey?: NamePath) => {
      // 数据格式的装换
    },
    [],
  );

  useEffect(() => {
    requestFormCacheId += 0;
  }, []);

  /**
   * 获取接口请求的初始化数据
   */
  const [initialData] = useFetchData({ request, params, proFieldKey: formKey });

  /**
   * 暴露ref给父组件
   */
  useImperativeHandle(
    propsFormRef,
    () => {
      return formRef?.current;
    },
    [!initialData],
  );

  return (
    <AppProFormEditOrReadOnlyContext.Provider
      value={{ mode: props.readonly ? 'read' : 'edit' }}
    >
      <Form
        {...omit(otherProps, ['labelWidth', 'autoFocusFirstInput'] as any[])}
        autoComplete="off"
        form={form}
        initialValues={initialValues}
        className={classNames(props.className)}
        onValuesChange={(changedValues, values) => {
          otherProps?.onValuesChange?.(
            transformKey(changedValues, !!omitNlUd),
            transformKey(values, !!omitNlUd),
          );
        }}
        onFinish={handleFinish}
      >
        <AppBaseFormComponents
          transformKey={transformKey}
          autoComplete="auto"
          loading={loading}
          {...props}
          formRef={formRef}
          initialValues={{
            ...initialValues,
            ...initialData,
          }}
        />
      </Form>
    </AppProFormEditOrReadOnlyContext.Provider>
  );
};

export default AppBaseForm;
